pragma solidity ^0.4.25;

import "./BaseSistemaClinico.sol";
import "../sistemaInterface/CapaExpedientesInterface.sol";


contract CapaExpedientes is BaseSistemaClinico, CapaExpedientesInterface  {

    event AltaExpediente(address _medico, address _paciente);
    event TrasladoExpediente(address _paciente, address _oldMedico, address _newMedico, address _administrativo);
    event BajaExpediente(address _medico, address _paciente);
    
    /**
    * @notice Constructor del contrato
    * @param _sistemaClinico La direccion del sistema clinico
    * @param _datos La direccion del contrato de los datos
    */
    constructor(address _sistemaClinico, address _datos) public BaseSistemaClinico(_sistemaClinico, _datos) {}

    /**
    * @notice Comprueba que el caller sea un medico o un administrativo del sistema
    */
    modifier onlyCrossMedicoOrAdministrativo(address _caller) {
        require(datos.isMedico(_caller) || datos.isAdministrativo(_caller), "Esta operacion solo puede realizarla un medico o un administrativo del sistema");
        _;
    }

    /****************************************************************************************/
    /*********************************** EXPEDIENTES ****************************************/
    /****************************************************************************************/

    /**
    * @notice Crea un nuevo expediente para un paciente dado
    * @dev Solo un medico deberia poder crear nuevos expedientes
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    */
    function addExpediente(address _paciente, address _oriCaller) public onlySistema onlyCrossMedico(_oriCaller) {
        addExpediente(_paciente, now, _oriCaller);
    }

    /**
    * @notice Crea un nuevo expediente para un paciente dado
    * @dev Solo un medico deberia poder crear nuevos expedientes
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    * @param _fechaNacimiento La fecha de nacimiento del paciente
    */
    function addExpediente(address _paciente, uint _fechaNacimiento, address _oriCaller) public onlySistema onlyCrossMedico(_oriCaller) {
        require(_fechaNacimiento <= now, "La fecha de nacimiento no puede ser mayor que la fecha actual");
        //Aniadimos el expediente a la lista de expedientes
        Expediente expediente = new Expediente(_paciente, _oriCaller, _fechaNacimiento);
        datos.addPaciente(_paciente, address(expediente));
        //Agregamos el expediente a la lista de expedientes del medico
        datos.addPacienteToMedico(_oriCaller, _paciente);
        emit AltaExpediente(_oriCaller, _paciente);
    }

    /**
    * @notice Cambia el estado del expediente a desaparecido
    * @dev Solo el sistema debe poder marcar un expediente como desaparecido
    * @param _paciente La direccion del paciente cuyo expediente se quiere modificar
    */
    function setExpedienteAsDesaparecido(address _paciente, address _oriCaller) public onlySistema onlyCrossAdministrativo(_oriCaller) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        expediente.cambiaEstado(Expediente.Estado.Desaparecido);
    }

    /**
    * @notice Cambia el estado del expediente desmarcandolo como desaparecido
    * @dev Solo el sistema debe poder marcar un expediente como aparecido
    * @param _paciente La direccion del paciente cuyo expediente se quiere modificar
    */
    function setExpedienteAsAparecido(address _paciente, address _oriCaller) public onlySistema onlyCrossAdministrativo(_oriCaller) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        expediente.cambiaEstado(Expediente.Estado.Vivo);
    }

    /**
    * @notice Transfiere todos los expedientes de un medico a otro
    * @dev Antes de llamar a este metodo hay que comprobar que ambos son medicos
    * @param _medicoFrom Medico del cual se van a transferir los expedientes
    * @param _medicoTo Medico al que se van a transferir los expedientes
    */
    function transfiereExpedientes(address _medicoFrom, address _medicoTo, address _oriCaller) public onlySistema onlyCrossAdministrativo(_oriCaller) {
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
                emit TrasladoExpediente(expedientesToTransfer[i], _medicoFrom, _medicoTo, _oriCaller);
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
    function transfiereExpediente(address _paciente, address _medicoTo, address _oriCaller) public onlySistema onlyCrossAdministrativo(_oriCaller) {
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
        emit TrasladoExpediente(_paciente, medicoFrom, _medicoTo, _oriCaller);
    }

    /**
    * @notice Cierra un expediente existente
    * @dev Al cerrar el expediente se desasigna al medico pero no el medico asignado del expediente
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    */
    function closeExpediente(address _paciente, address _oriCaller) public onlySistema onlyCrossMedico(_oriCaller) {
        require(_paciente != _oriCaller, "Ha recompilado");
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        //Tenemos que desasignar el expediente al medico
        datos.removePacienteFromMedico(expediente.getMedicoAsignado(), _paciente);
        expediente.close(_oriCaller);
        emit BajaExpediente(_oriCaller, _paciente);
    }

    /**
    * @notice Retorna la informacion de un expediente
    * @param _paciente La direccion del paciente del que se quiere recuperar el expediente
    * @return La informacion del expediente
    */
    function getExpediente(address _paciente, address _oriCaller) public view onlySistema
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
            require(owner == _oriCaller || datos.isAdministrativo(_oriCaller), "Solo el propietario o un administrativo pueden consultar expedientes cerrados");
        } else {
            require(datos.isMedico(_oriCaller), "Solo un medico del sistema puede consultar un expediente abierto");
        }
//        emit ConsultaExpediente(_oriCaller, _paciente);
        return (_paciente,  expediente.getMedicoAsignado(), expediente.getFechaNacimiento(), expediente.getFechaMuerte(), expediente.getEstado(), expediente.getTratamientoAbiertosIds());
    }

    /**
    * @notice Comprueba si una persona es paciente
    * @param _supuestoPaciente La direccion del paciente que hay que comprobar
    * @return Booleano que indica si es paciente o no
    */
    function isPaciente(address _supuestoPaciente, address _oriCaller) public view onlySistema onlyCrossMedicoOrAdministrativo(_oriCaller) returns (bool) {
        return datos.isPaciente(_supuestoPaciente);
    }

    /**
    * @notice Obtiene todos los pacientes de un medico
    * @param _medico La direccion del medico del que queremos recuperar los pacientes
    * @return Lista de direcciones de sus pacientes
    */
    function getPacientesFromMedico(address _medico, address _oriCaller) public view onlySistema onlyCrossMedicoOrAdministrativo(_oriCaller) returns (address[]) {
        return datos.getPacientesFromMedico(_medico);
    }

    /****************************************************************************************/
    /*********************************** TRATAMIENTOS ***************************************/
    /****************************************************************************************/

    /**
    * @notice Aniade un nuevo tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere aniadir el tratamiento
    * @param _dolencia Dolencia de la que se queja el paciente
    * @param _descripcion Descripcion del tratamiento a seguir
    * @return El identificador del nuevo tratamiento
    */
    function addTratamientoToExpediente(address _paciente, string _dolencia, string _descripcion, address _oriCaller) public onlySistema onlyCrossMedico(_oriCaller) returns(uint) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        return expediente.addTratamiento(_dolencia, _descripcion, _oriCaller);
    }

    /**
    * @notice Modifica un tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere aniadir el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    * @param _descripcion Descripcion del tratamiento a seguir
    */
    function updateTratamientoToExpediente(address _paciente, uint _idxTratamiento, string _descripcion, address _oriCaller) public onlySistema onlyCrossMedico(_oriCaller) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        expediente.updateTratamiento(_idxTratamiento, _descripcion, _oriCaller);
    }

    /**
    * @notice Modifica un tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere cerrar el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    */
    function closeTratamientoToExpediente(address _paciente, uint _idxTratamiento, address _oriCaller) public onlySistema onlyCrossMedico(_oriCaller) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        expediente.closeTratamiento(_idxTratamiento, _oriCaller);
    }

    /**
    * @notice Obtiene el tratamiento de un expediente
    * @param _paciente La direccion del paciente del que se quiere recuperar el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    */
    function getTratamientoFromExpediente(address _paciente, uint _idxTratamiento, address _oriCaller) public view onlySistema onlyCrossMedico(_oriCaller)
        returns (
            uint fechaInicio,
            uint fechaFin,
            string dolencia,
            string descripcion
        )
    {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        return expediente.getTratamiento(_idxTratamiento);
    }
}
