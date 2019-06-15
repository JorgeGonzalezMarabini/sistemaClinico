pragma solidity ^0.4.25;

import "./CapaMedicos.sol";
import "../Expediente.sol";

contract CapaExpedientes is CapaMedicos {

    event AltaExpediente(address _medico, address _paciente);
    event TrasladoExpediente(address _paciente, address _oldMedico, address _newMedico);
    event BajaExpediente(address _medico, address _paciente);

    mapping(address => bool) internal pacientes;

    /**
    * @notice Comprueba que el sender sea el medico asignado del paciente pasado
    * @param _paciente La direccion del paciente
    */
    modifier onlyMedicoAsignado(address _paciente) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        require(expediente.getMedicoAsignado() == msg.sender, "Solo el medico del expediente puede realizar cambios sobre el");
        _;
    }

    /**
    * @notice Comprueba que la direccion pasada corresponde a un paciente del sistema
    * @param _pacienteToTest La direccion a comprobar
    */
    modifier onlyPaciente(address _pacienteToTest) {
        require(pacientes[_pacienteToTest], "El usuario no es un paciente del sistema");
        _;
    }

    /**
    * @notice Comprueba que el sender sea un medico o un administrativo del sistema
    */
    modifier onlyMedicoOrAdministrativo() {
        require(medicos[msg.sender] || administrativos[msg.sender], "Esta operacion solo puede realizarla un medico o un administrativo del sistema");
        _;
    }

    /**
    * @notice Crea un nuevo expediente para un paciente dado
    * @dev Solo un medico deberia poder crear nuevos expedientes
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    */
    function addExpediente(address _paciente) public onlyMedico {
        addExpediente(_paciente, now);
    }

    /**
    * @notice Crea un nuevo expediente para un paciente dado
    * @dev Solo un medico deberia poder crear nuevos expedientes
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    * @param _fechaNacimiento La fecha de nacimiento del paciente
    */
    function addExpediente(address _paciente, uint _fechaNacimiento) public onlyMedico {
        require(!pacientes[_paciente], "El paciente ya tiene un expediente asociado");
        require(_fechaNacimiento <= now, "La fecha de nacimiento no puede ser mayor que la fecha actual");
        //Aniadimos el expediente a la lista de expedientes
        Expediente expediente = new Expediente(_paciente, msg.sender, _fechaNacimiento);
        datos.addPaciente(_paciente, address(expediente));
        pacientes[_paciente] = true;
        //Agregamos el expediente a la lista de expedientes del medico
        datos.addPacienteToMedico(msg.sender, _paciente);
        emit AltaExpediente(msg.sender, _paciente);
    }

    /**
    * @notice Cambia el estado del expediente a desaparecido
    * @dev Solo el sistema debe poder marcar un expediente como desaparecido
    * @param _paciente La direccion del paciente cuyo expediente se quiere modificar
    */
    function setExpedienteAsDesaparecido(address _paciente) public onlyAdministrativo onlyPaciente(_paciente) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        expediente.cambiaEstado(Expediente.Estado.Desaparecido);
    }

    /**
    * @notice Cambia el estado del expediente desmarcandolo como desaparecido
    * @dev Solo el sistema debe poder marcar un expediente como aparecido
    * @param _paciente La direccion del paciente cuyo expediente se quiere modificar
    */
    function setExpedienteAsAparecido(address _paciente) public onlyAdministrativo onlyPaciente(_paciente) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        expediente.cambiaEstado(Expediente.Estado.Vivo);
    }

    /**
    * @notice Transfiere todos los expedientes de un medico a otro
    * @dev Antes de llamar a este metodo hay que comprobar que ambos son medicos
    * @param _medicoFrom Medico del cual se van a transferir los expedientes
    * @param _medicoTo Medico al que se van a transferir los expedientes
    */
    function transfiereExpedientes(address _medicoFrom, address _medicoTo) public onlyAdministrativo onlyOverMedico(_medicoFrom) onlyOverMedico(_medicoTo) {
        require(_medicoFrom != _medicoTo, "Solo se puede transferir los expedientes a un medico distinto");
        address[] memory expedientesToTransfer = datos.getPacientesFromMedico(_medicoFrom);
        if(expedientesToTransfer.length > 0) {
            for(uint i = 0; i < expedientesToTransfer.length; i++) {
                //Transferimos el expediente al nuevo medico
                datos.addPacienteToMedico(_medicoTo, expedientesToTransfer[i]);
                //Cambiamos el medico al expediente
                Expediente expediente = Expediente(datos.getExpedienteAddress(expedientesToTransfer[i]));
                expediente.cambiaMedico(_medicoTo);
                //Emitimos el evento de traslado
                emit TrasladoExpediente(expedientesToTransfer[i], _medicoFrom, _medicoTo);
            }
            //Para acabar borramos todos los expedientes al medico fuente
            datos.removeAllPacientesFromMedico(_medicoFrom);
        }
    }

    /**
    * @notice Transfiere un expediente de un medico a otro
    * @param _paciente La direccion del paciente cuyo expediente queremos trasladar
    * @param _medicoTo La direccion del medico al que se va a transferir el expediente
    */
    function transfiereExpediente(address _paciente, address _medicoTo) public onlyAdministrativo onlyPaciente(_paciente) onlyOverMedico(_medicoTo) {
        //Primero tenemos que borrarlo de la lista
        Expediente expedienteToTransfer = Expediente(datos.getExpedienteAddress(_paciente));
        address medicoFrom = expedienteToTransfer.getMedicoAsignado();
        //Nos aseguramos de que el medico destino es distinto del asignado
        require(medicoFrom != _medicoTo, "Solo se puede transferir un expediente a un medico distinto del actual");
        //Cambiamos el expediente al nuevo medico
        datos.addPacienteToMedico(_medicoTo, _paciente);
        expedienteToTransfer.cambiaMedico(_medicoTo);
        //Tenemos que desasignar el expediente del medico anterior
        datos.removePacienteFromMedico(medicoFrom, _paciente);
        //Emitimos el evento de traslado
        emit TrasladoExpediente(_paciente, medicoFrom, _medicoTo);
    }

    /**
    * @notice Cierra un expediente existente
    * @dev Al cerrar el expediente se desasigna al medico pero no el medico asignado del expediente
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    */
    function closeExpediente(address _paciente) public onlyMedico onlyPaciente(_paciente) onlyMedicoAsignado(_paciente) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        //Tenemos que desasignar el expediente al medico
        datos.removePacienteFromMedico(expediente.getMedicoAsignado(), _paciente);
        expediente.close();
        emit BajaExpediente(msg.sender, _paciente);
    }

    /**
    * @notice Retorna la informacion de un expediente
    * @param _paciente La direccion del paciente del que se quiere recuperar el expediente
    * @return La informacion del expediente
    */
    function getExpediente(address _paciente) public view onlyPaciente(_paciente)
        returns (
            address titular,
            address medicoAsignado,
            uint fechaNacimiento,
            uint fechaMuerte,
            Expediente.Estado estado,
            uint[] tratamientosAbiertos
        )
    {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        if(expediente.getEstado() == Expediente.Estado.Muerto) {
            require(owner == msg.sender || administrativos[msg.sender], "Solo el propietario o un administrativo pueden consultar expedientes cerrados");
        } else {
            require(expediente.getMedicoAsignado() == msg.sender, "Solo el medico del expediente puede realizar operaciones sobre el");
        }
//        emit ConsultaExpediente(msg.sender, _paciente);
        return (_paciente,  expediente.getMedicoAsignado(), expediente.getFechaNacimiento(), expediente.getFechaMuerte(), expediente.getEstado(), expediente.getTratamientoAbiertosIds());
    }

    /**
    * @notice Comprueba si una persona es paciente
    * @param _supuestoPaciente La direccion del paciente que hay que comprobar
    * @return Booleano que indica si es paciente o no
    */
    function isPaciente(address _supuestoPaciente) public view onlyMedicoOrAdministrativo returns (bool) {
        return pacientes[_supuestoPaciente];
    }

    /**
    * @notice Obtiene todos los pacientes de un medico
    * @param _medico La direccion del medico del que queremos recuperar los pacientes
    * @return Lista de direcciones de sus pacientes
    */
    function getPacientesFromMedico(address _medico) public view onlyMedicoOrAdministrativo onlyOverMedico(_medico) returns (address[]) {
        return datos.getPacientesFromMedico(_medico);
    }
}
