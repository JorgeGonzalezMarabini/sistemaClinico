pragma solidity ^0.4.25;

contract CapaAdministrativaInterface {

    /**
    * @notice Da de alta un nuevo administrativo en el sistema
    * @param _administrativoToAdd La direccion del administrativo que se va a dar de alta
    * @param _oriCaller La direccion del invocador original
    */
    function addAdministrativo(address _administrativoToAdd, address _oriCaller) public;

    /**
    * @notice Da de baja un administrativo en el sistema
    * @param _administrativoToRemove La direccion del administrativo que se va a dar de baja
    * @param _oriCaller La direccion del invocador original
    */
    function removeAdministrativo(address _administrativoToRemove, address _oriCaller) public;

    /**
    * @notice Comprueba si una persona es administrativo
    * @param _supuestoAdministrativo La direccion del administrativo que hay que comprobar
    * @param _oriCaller La direccion del invocador original
    * @return Booleano que indica si es administrativo o no
    */
    function isAdministrativo(address _supuestoAdministrativo, address _oriCaller) public view returns (bool);

}
