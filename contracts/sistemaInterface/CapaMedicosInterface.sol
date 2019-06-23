pragma solidity ^0.4.25;

contract CapaMedicosInterface {

    /**
    * @notice Da de alta un nuevo medico al sistema
    * @param _medicoToAdd La direccion del medico que se va a dar de alta
    * @param _oriCaller La direccion del invocador original
    */
    function addMedico(address _medicoToAdd, address _oriCaller) public;

    /**
    * @notice Da de baja a un medico transferiendo todos sus expedientes a otro
    * @param _medicoToRemove La direccion del medico que se va a dar de baja
    * @param _oriCaller La direccion del invocador original
    */
    function removeMedico(address _medicoToRemove, address _oriCaller) public;

    /**
    * @notice Comprueba si una persona es medico
    * @param _supuestoMedico La direccion del medico que hay que comprobar
    * @param _oriCaller La direccion del invocador original
    * @return Booleano que indica si es medico o no
    */
    function isMedico(address _supuestoMedico, address _oriCaller) public view returns (bool);
}
