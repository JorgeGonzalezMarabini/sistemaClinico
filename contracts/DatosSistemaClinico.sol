pragma solidity ^0.4.25;

import "./utils/Arrays.sol";
import "./Owned.sol";

contract DatosSistemaClinico is Owned {

    using Arrays for address[];

    mapping(address => bool) internal serviciosSistema;
    address[] internal serviciosSistemaList;
    
    address internal sistemaClinico;
    //Administrativos
    mapping(address => bool) internal administrativos;
    address[] internal administrativosList;
    //Medicos
    mapping(address => bool) internal medicos;
    address[] internal medicosList;
    //Pacientes/Expedientes
    mapping(address => bool) internal pacientes;
    address[] internal pacientesList;
    mapping(address => address) internal expedientes;
    mapping(address => address[]) internal pacientesByMedico;

    /**
    * @notice Constructor del contrato
    * @param _sistemaClinico La direccion del sistema clinico
    */
    constructor(address _sistemaClinico) public {
        sistemaClinico = _sistemaClinico;
    }

    /**
    * @notice Comprueba que el sender sea el sistema clinico
    */
    modifier onlyServicioSistema() {
        require(serviciosSistema[msg.sender], "Esta operacion solo puede ser realizada por un servicio del sistema medico");
        _;
    }

    /**
    * @notice Comprueba que el sender sea el sistema clinico
    */
    modifier onlyServicioSistemaOrOwner() {
        require(serviciosSistema[msg.sender] || msg.sender == owner, "Esta operacion solo puede ser realizada por el sistema medico asignado o por el propietario");
        _;
    }

    /**
    * @notice Comprueba que la direccion pasada corresponde a un medico del sistema
    * @param _medicoToTest La direccion a comprobar
    */
    modifier onlyOverMedico(address _medicoToTest) {
        require(medicos[_medicoToTest], "El medico no pertenece al sistema");
        _;
    }

    /**
    * @notice Comprueba que la direccion pasada corresponde a un paciente del sistema
    * @param _pacienteToTest La direccion a comprobar
    */
    modifier onlyOverPaciente(address _pacienteToTest) {
        require(pacientes[_pacienteToTest], "El paciente no pertenece al sistema");
        _;
    }

    /**
    * @notice Comprueba que la direccion pasada corresponde a un administrativo del sistema
    * @param _administrativoToTest La direccion a comprobar
    */
    modifier onlyOverAdministrativo(address _administrativoToTest) {
        require(administrativos[_administrativoToTest], "El administrativo no pertenece al sistema");
        _;
    }

    /**
    * @notice Da de alta un nuevo servicio
    * @param _servicioToAdd La direccion del servicio que se va a dar de alta
    */
    function addServicioSistemaClinico(address _servicioToAdd) public onlyOwner {
        require(!serviciosSistema[_servicioToAdd], "El servicio ya pertenece al sistema");
        serviciosSistemaList.push(_servicioToAdd);
        serviciosSistema[_servicioToAdd] = true;
    }

    /**
    * @notice Da de baja un servicio
    * @param _servicioToRemove La direccion del administrativo que se va a dar de baja
    */
    function removeServicioSistemaClinico(address _servicioToRemove) public onlyOwner {
        require(serviciosSistema[_servicioToRemove], "El servicio no pertenece al sistema");
        serviciosSistemaList.deleteByAddress(_servicioToRemove);
        serviciosSistema[_servicioToRemove] = false;
    }

    /****************************************************************************************/
    /********************************* ADMINISTRATIVOS **************************************/
    /****************************************************************************************/

    /**
    * @notice Da de alta un nuevo administrativo en el sistema
    * @param _administrativoToAdd La direccion del administrativo que se va a dar de alta
    */
    function addAdministrativo(address _administrativoToAdd) public onlyServicioSistema {
        require(!administrativos[_administrativoToAdd], "El administrativo ya pertenece al sistema");
        administrativosList.push(_administrativoToAdd);
        administrativos[_administrativoToAdd] = true;
    }

    /**
    * @notice Da de baja un administrativo
    * @param _administrativoToRemove La direccion del administrativo que se va a dar de baja
    */
    function removeAdministrativo(address _administrativoToRemove) public onlyServicioSistema onlyOverAdministrativo(_administrativoToRemove) {
        administrativosList.deleteByAddress(_administrativoToRemove);
        administrativos[_administrativoToRemove] = false;
    }
    
    /**
    * @notice Comprueba si una persona es administrativo
    * @param _administrativoToTest La direccion del administrativo que hay que comprobar
    * @return Booleano que indica si es administrativo o no
    */
    function isAdministrativo(address _administrativoToTest) public view onlyServicioSistema returns (bool) {
        return administrativos[_administrativoToTest];
    }

    /****************************************************************************************/
    /************************************ MEDICOS *******************************************/
    /****************************************************************************************/

    /**
    * @notice Da de alta un nuevo medico
    * @param _medicoToAdd La direccion del medico que se va a dar de alta
    */
    function addMedico(address _medicoToAdd) public onlyServicioSistema {
        require(!medicos[_medicoToAdd], "El medico ya pertenece al sistema");
        medicosList.push(_medicoToAdd);
        medicos[_medicoToAdd] = true;
    }

    /**
    * @notice Da de baja un medico
    * @param _medicoToRemove La direccion del medico que se va a dar de baja
    */
    function removeMedico(address _medicoToRemove) public onlyServicioSistema onlyOverMedico(_medicoToRemove) {
        medicosList.deleteByAddress(_medicoToRemove);
        medicos[_medicoToRemove] = false;
    }

    /**
    * @notice Comprueba si una persona es medico
    * @param _medicoToTest La direccion del medico que hay que comprobar
    * @return Booleano que indica si es medico o no
    */
    function isMedico(address _medicoToTest) public view onlyServicioSistema returns (bool) {
        return medicos[_medicoToTest];
    }

    /****************************************************************************************/
    /********************************** EXPEDIENTES *****************************************/
    /****************************************************************************************/

    /**
    * @notice Da de alta un nuevo paciente
    * @param _pacienteToAdd La direccion del paciente que se va a dar de alta
    * @param _expedienteAddress La direccion del expediente del paciente que se va a dar de alta
    */
    function addPaciente(address _pacienteToAdd, address _expedienteAddress) public onlyServicioSistema {
        require(!pacientes[_pacienteToAdd], "El paciente ya pertenece al sistema");
        expedientes[_pacienteToAdd] = _expedienteAddress;
        pacientesList.push(_pacienteToAdd);
        pacientes[_pacienteToAdd] = true;
    }

    function addPacienteToMedico(address _medico, address _paciente) public onlyServicioSistema onlyOverMedico(_medico) onlyOverPaciente(_paciente) {
        pacientesByMedico[_medico].push(_paciente);
    }

    function removePacienteFromMedico(address _medico, address _paciente) public onlyServicioSistema onlyOverMedico(_medico) onlyOverPaciente(_paciente) {
        pacientesByMedico[_medico].deleteByAddress(_paciente);
    }

    function removeAllPacientesFromMedico(address _medico) public onlyServicioSistema onlyOverMedico(_medico) {
        pacientesByMedico[_medico].length = 0;
    }

    function getPacientesFromMedico(address _medico) public view onlyServicioSistema onlyOverMedico(_medico) returns (address[]) {
        return pacientesByMedico[_medico];
    }

    /**
    * @notice Comprueba si una persona es paciente
    * @param _pacienteToTest La direccion del paciente que hay que comprobar
    * @return Booleano que indica si es paciente o no
    */
    function isPaciente(address _pacienteToTest) public view onlyServicioSistema returns (bool) {
        return pacientes[_pacienteToTest];
    }

    /****************************************************************************************/
    /************************************ MIGRACION *****************************************/
    /****************************************************************************************/

    /**
    * @notice Cambia la direccion del expediente de un paciente
    * @dev Este metodo esta pensado para soportar una migracion de expedientes
    * @param _paciente La direccion del paciente al que se va a cambiar el expediente
    * @param _newExpedienteAddress La direccion del nuevo expediente
    */
    function changeExpedienteToPaciente(address _paciente, address _newExpedienteAddress) public onlyOwner onlyOverPaciente(_paciente) {
        expedientes[_paciente] = _newExpedienteAddress;
    }

    /****************************************************************************************/
    /************************************ GETTERS *******************************************/
    /****************************************************************************************/

    /**
    * @notice Devuelve la direccion del expediente del paciente
    * @param _paciente La direccion del paciente
    * @return La direccion del expediente
    */
    function getExpedienteAddress(address _paciente) public view onlyServicioSistemaOrOwner onlyOverPaciente(_paciente) returns (address) {
        return expedientes[_paciente];
    }

    /**
    * @notice Devuelve la direccion del sistema clinico
    * @return La direccion del sistema clinico
    */
    function getSistemaClinico() public view onlyOwner returns (address) {
        return sistemaClinico;
    }

    /**
    * @notice Devuelve todos los medicos
    * @return La lista con todos los medicos
    */
    function getMedicosList() public view onlyOwner returns (address[]) {
        return medicosList;
    }

    /**
    * @notice Devuelve todos los administrativos
    * @return La lista con todos los administrativos
    */
    function getAdministrativosList() public view onlyOwner returns (address[]) {
        return administrativosList;
    }

    /**
    * @notice Devuelve todos los pacientes
    * @return La lista con todos los pacientes
    */
    function getPacientesList() public view onlyOwner returns (address[]) {
        return pacientesList;
    }
}
