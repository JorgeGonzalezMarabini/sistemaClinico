pragma solidity ^0.4.25;

import "./utils/Arrays.sol";
import "./Owned.sol";

contract DatosSistemaClinico is Owned {

    using Arrays for address[];

    address internal sistemaClinico;
    address[] internal medicosList;
    address[] internal administrativosList;
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
    modifier onlySistema() {
        require(msg.sender == sistemaClinico, "Esta operacion solo puede ser realizada por el sistema medico asignado");
        _;
    }

    /**
    * @notice Comprueba que el sender sea el sistema clinico
    */
    modifier onlySistemaOrOwner() {
        require(msg.sender == sistemaClinico || msg.sender == owner, "Esta operacion solo puede ser realizada por el sistema medico asignado o por el propietario");
        _;
    }

    /**
    * @notice Comprueba que el sender sea el sistema clinico
    */
    function setSistemaClinico(address _sistemaClinico) public onlyOwner {
        sistemaClinico = _sistemaClinico;
    }

    /**
    * @notice Da de alta un nuevo medico
    * @param _medicoToAdd La direccion del medico que se va a dar de alta
    */
    function addMedico(address _medicoToAdd) public onlySistema {
        medicosList.push(_medicoToAdd);
    }

    /**
    * @notice Da de baja un medico
    * @param _medicoToRemove La direccion del medico que se va a dar de baja
    */
    function removeMedico(address _medicoToRemove) public onlySistema {
        medicosList.deleteByAddress(_medicoToRemove);
    }

    /**
    * @notice Da de alta un nuevo administrativo en el sistema
    * @param _administrativoToAdd La direccion del administrativo que se va a dar de alta
    */
    function addAdministrativo(address _administrativoToAdd) public onlySistema {
        administrativosList.push(_administrativoToAdd);
    }

    /**
    * @notice Da de baja un administrativo
    * @param _administrativoToRemove La direccion del administrativo que se va a dar de baja
    */
    function removeAdministrativo(address _administrativoToRemove) public onlySistema {
        administrativosList.deleteByAddress(_administrativoToRemove);
    }

    /**
    * @notice Da de alta un nuevo paciente
    * @param _pacienteToAdd La direccion del paciente que se va a dar de alta
    * @param _expedienteAddress La direccion del expediente del paciente que se va a dar de alta
    */
    function addPaciente(address _pacienteToAdd, address _expedienteAddress) public onlySistema {
        expedientes[_pacienteToAdd] = _expedienteAddress;
        pacientesList.push(_pacienteToAdd);
    }

    function addPacienteToMedico(address _medico, address _paciente) public onlySistema {
        pacientesByMedico[_medico].push(_paciente);
    }

    function removePacienteFromMedico(address _medico, address _paciente) public onlySistema {
        pacientesByMedico[_medico].deleteByAddress(_paciente);
    }

    function removeAllPacientesFromMedico(address _medico) public onlySistema {
        pacientesByMedico[_medico].length = 0;
    }

    function getPacientesFromMedico(address _medico) public view onlySistema returns (address[]) {
        return pacientesByMedico[_medico];
    }

    /****************************************************************************************/
    /************************************ GETTERS *******************************************/
    /****************************************************************************************/

    /**
    * @notice Devuelve la direccion del expediente del paciente
    * @param _paciente La direccion del paciente
    * @return La direccion del expediente
    */
    function getExpedienteAddress(address _paciente) public view onlySistemaOrOwner returns (address) {
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
