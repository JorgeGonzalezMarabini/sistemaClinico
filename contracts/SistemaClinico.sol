pragma solidity ^0.4.25;

import "./Owned.sol";
import "./sistemaInterface/CapaAdministrativaInterface.sol";
import "./sistemaInterface/CapaMedicosInterface.sol";
import "./sistemaInterface/CapaExpedientesInterface.sol";

contract SistemaClinico is Owned {

    CapaAdministrativaInterface internal capaAdmin;
    CapaMedicosInterface internal capaMed;
    CapaExpedientesInterface internal capaExp;

    function setCapaAdministrativa(address _capaAdmi) public onlyOwner {
        capaAdmin = CapaAdministrativaInterface(_capaAdmi);
    }

    function setCapaMedicos(address _capaMed) public onlyOwner {
        capaMed = CapaMedicosInterface(_capaMed);
    }

    function setCapaExpedientes(address _capaExp) public onlyOwner {
        capaExp = CapaExpedientesInterface(_capaExp);
    }

    /****************************************************************************************/
    /********************************* ADMINISTRATIVOS **************************************/
    /****************************************************************************************/

    /**
    * @notice Da de alta un nuevo administrativo en el sistema
    * @param _administrativoToAdd La direccion del administrativo que se va a dar de alta
    */
    function addAdministrativo(address _administrativoToAdd) public {
        capaAdmin.addAdministrativo(_administrativoToAdd, msg.sender);
    }

    /**
    * @notice Da de baja un administrativo en el sistema
    * @param _administrativoToRemove La direccion del administrativo que se va a dar de baja
    */
    function removeAdministrativo(address _administrativoToRemove) public {
        capaAdmin.removeAdministrativo(_administrativoToRemove, msg.sender);
    }

    /**
    * @notice Comprueba si una persona es administrativo
    * @param _supuestoAdministrativo La direccion del administrativo que hay que comprobar
    * @return Booleano que indica si es administrativo o no
    */
    function isAdministrativo(address _supuestoAdministrativo) public view returns (bool) {
        return capaAdmin.isAdministrativo(_supuestoAdministrativo, msg.sender);
    }

    /****************************************************************************************/
    /************************************ MEDICOS *******************************************/
    /****************************************************************************************/

    /**
    * @notice Da de alta un nuevo medico al sistema
    * @param _medicoToAdd La direccion del medico que se va a dar de alta
    */
    function addMedico(address _medicoToAdd) public {
        capaMed.addMedico(_medicoToAdd, msg.sender);
    }

    /**
    * @notice Da de baja a un medico transferiendo todos sus expedientes a otro
    * @param _medicoToRemove La direccion del medico que se va a dar de baja
    * @param _medicoToTransfer La direccion del medico al que se van a transferir los expedientes
    */
    function removeMedico(address _medicoToRemove, address _medicoToTransfer) public {
        //En primer lugar transferimos todos los expedientes
        capaExp.transfiereExpedientes(_medicoToRemove, _medicoToTransfer, msg.sender);
        capaMed.removeMedico(_medicoToRemove, msg.sender);
    }


    /**
    * @notice Comprueba si una persona es medico
    * @param _supuestoMedico La direccion del medico que hay que comprobar
    * @return Booleano que indica si es medico o no
    */
    function isMedico(address _supuestoMedico) public view returns (bool) {
        return capaMed.isMedico(_supuestoMedico, msg.sender);
    }

    /****************************************************************************************/
    /********************************** EXPEDIENTES *****************************************/
    /****************************************************************************************/

    /**
    * @notice Crea un nuevo expediente para un paciente dado
    * @dev Solo un medico deberia poder crear nuevos expedientes
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    */
    function addExpediente(address _paciente) public {
        capaExp.addExpediente(_paciente, msg.sender);
    }

    /**
    * @notice Crea un nuevo expediente para un paciente dado
    * @dev Solo un medico deberia poder crear nuevos expedientes
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    * @param _fechaNacimiento La fecha de nacimiento del paciente
    */
    function addExpediente(address _paciente, uint _fechaNacimiento) public {
        capaExp.addExpediente(_paciente, _fechaNacimiento, msg.sender);
    }

    /**
    * @notice Cambia el estado del expediente a desaparecido
    * @dev Solo el sistema debe poder marcar un expediente como desaparecido
    * @param _paciente La direccion del paciente cuyo expediente se quiere modificar
    */
    function setExpedienteAsDesaparecido(address _paciente) public {
        capaExp.setExpedienteAsDesaparecido(_paciente, msg.sender);
    }

    /**
    * @notice Cambia el estado del expediente desmarcandolo como desaparecido
    * @dev Solo el sistema debe poder marcar un expediente como aparecido
    * @param _paciente La direccion del paciente cuyo expediente se quiere modificar
    */
    function setExpedienteAsAparecido(address _paciente) public {
        capaExp.setExpedienteAsAparecido(_paciente, msg.sender);
    }

    /**
    * @notice Transfiere todos los expedientes de un medico a otro
    * @dev Antes de llamar a este metodo hay que comprobar que ambos son medicos
    * @param _medicoFrom Medico del cual se van a transferir los expedientes
    * @param _medicoTo Medico al que se van a transferir los expedientes
    */
    function transfiereExpedientes(address _medicoFrom, address _medicoTo) public {
        capaExp.transfiereExpedientes(_medicoFrom, _medicoTo, msg.sender);
    }

    /**
    * @notice Transfiere un expediente de un medico a otro
    * @param _paciente La direccion del paciente cuyo expediente queremos trasladar
    * @param _medicoTo La direccion del medico al que se va a transferir el expediente
    */
    function transfiereExpediente(address _paciente, address _medicoTo) public {
        capaExp.transfiereExpediente(_paciente, _medicoTo, msg.sender);
    }

    /**
    * @notice Cierra un expediente existente
    * @dev Al cerrar el expediente se desasigna al medico pero no el medico asignado del expediente
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    */
    function closeExpediente(address _paciente) public {
        capaExp.closeExpediente(_paciente, msg.sender);
    }

    /**
    * @notice Lanza el evento de consulta de expediente
    * @param _paciente La direccion del paciente del que se ha recuperado el expediente
    */
    function registraConsultaExpediente(address _paciente) public {
        capaExp.registraConsultaExpediente(_paciente, msg.sender);
    }

    /**
    * @notice Retorna la informacion de un expediente
    * @param _paciente La direccion del paciente del que se quiere recuperar el expediente
    * @return La informacion del expediente
    */
    function getExpediente(address _paciente) public view
        returns (
            address titular,
            address medicoAsignado,
            uint fechaNacimiento,
            uint fechaMuerte,
            uint estado,
            uint[] tratamientosAbiertos
        ) {
        return capaExp.getExpediente(_paciente, msg.sender);
    }

    /**
    * @notice Comprueba si una persona es paciente
    * @param _supuestoPaciente La direccion del paciente que hay que comprobar
    * @return Booleano que indica si es paciente o no
    */
    function isPaciente(address _supuestoPaciente) public view returns (bool) {
        return capaExp.isPaciente(_supuestoPaciente, msg.sender);
    }

    /**
    * @notice Obtiene todos los pacientes de un medico
    * @param _medico La direccion del medico del que queremos recuperar los pacientes
    * @return Lista de direcciones de sus pacientes
    */
    function getPacientesFromMedico(address _medico) public view returns (address[]) {
        return capaExp.getPacientesFromMedico(_medico, msg.sender);
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
    function addTratamientoToExpediente(address _paciente, string _dolencia, string _descripcion) public returns(uint) {
        return capaExp.addTratamientoToExpediente(_paciente, _dolencia, _descripcion, msg.sender);
    }

    /**
    * @notice Modifica un tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere aniadir el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    * @param _descripcion Descripcion del tratamiento a seguir
    */
    function updateTratamientoToExpediente(address _paciente, uint _idxTratamiento, string _descripcion) public {
        capaExp.updateTratamientoToExpediente(_paciente, _idxTratamiento, _descripcion, msg.sender);
    }

    /**
    * @notice Modifica un tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere cerrar el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    */
    function closeTratamientoToExpediente(address _paciente, uint _idxTratamiento) public {
        capaExp.closeTratamientoToExpediente(_paciente, _idxTratamiento, msg.sender);
    }

    /**
    * @notice Lanza el evento de consulta de tratamiento
    * @dev Esto deberia lanzarse automaticamente al consultar el tratamiento
    * @param _paciente La direccion del paciente
    * @param _idxTratamiento El identificador del tratamiendo que queremos recuperar
    */
    function registraConsultaTratamiento(address _paciente, uint _idxTratamiento) public {
        return capaExp.registraConsultaTratamiento(_paciente, _idxTratamiento, msg.sender);
    }

    /**
    * @notice Obtiene el tratamiento de un expediente
    * @param _paciente La direccion del paciente del que se quiere recuperar el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    */
    function getTratamientoFromExpediente(address _paciente, uint _idxTratamiento) public view
        returns (
            uint fechaInicio,
            uint fechaFin,
            string dolencia,
            string descripcion
        ) {
        return capaExp.getTratamientoFromExpediente(_paciente, _idxTratamiento, msg.sender);
    }
}