pragma solidity ^0.4.25;

import "./CapaAdministrativa.sol";

contract CapaMedicos is CapaAdministrativa {

    mapping(address => bool) internal medicos;

    /**
    * @notice Comprueba que el sender sea un medico del sistema
    */
    modifier onlyMedico() {
        require(medicos[msg.sender], "Esta operacion solo puede realizarla un medico del sistema");
        _;
    }

    /**
    * @notice Comprueba que la direccion pasada corresponde a un medico del sistema
    * @param _medicoToTest La direccion a comprobar
    */
    modifier onlyOverMedico(address _medicoToTest) {
        require(medicos[_medicoToTest], "Esta operacion solo puede ser realizada sobre un medico del sistema");
        _;
    }

    /****************************************************************************************/
    /************************************ MEDICOS *******************************************/
    /****************************************************************************************/

    /**
    * @notice Da de alta un nuevo medico al sistema
    * @param _medicoToAdd La direccion del medico que se va a dar de alta
    */
    function addMedico(address _medicoToAdd) public onlyAdministrativo {
        require(!medicos[_medicoToAdd], "El medico ya pertenece al sistema");
        medicos[_medicoToAdd] = true;
        datos.addMedico(_medicoToAdd);
    }

    /**
    * @notice Da de baja a un medico transferiendo todos sus expedientes a otro
    * @param _medicoToRemove La direccion del medico que se va a dar de baja
    * @param _medicoToTransfer La direccion del medico al que se van a transferir los expedientes
    */
    function removeMedico(address _medicoToRemove, address _medicoToTransfer) public onlyAdministrativo onlyOverMedico(_medicoToRemove) onlyOverMedico(_medicoToTransfer) {
        //En primer lugar transferimos todos los expedientes
        transfiereExpedientes(_medicoToRemove, _medicoToTransfer);
        medicos[_medicoToRemove] = false;
        datos.removeMedico(_medicoToRemove);
    }

    /**
    * @notice Transfiere todos los expedientes de un medico a otro
    * @dev Antes de llamar a este metodo hay que comprobar que ambos son medicos
    * @param _medicoFrom Medico del cual se van a transferir los expedientes
    * @param _medicoTo Medico al que se van a transferir los expedientes
    */
    function transfiereExpedientes(address _medicoFrom, address _medicoTo) public;

    /**
    * @notice Comprueba si una persona es medico
    * @param _supuestoMedico La direccion del medico que hay que comprobar
    * @return Booleano que indica si es medico o no
    */
    function isMedico(address _supuestoMedico) public view onlyAdministrativo returns (bool) {
        return medicos[_supuestoMedico];
    }
}
