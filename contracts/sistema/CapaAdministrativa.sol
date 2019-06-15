pragma solidity ^0.4.25;

import "./BaseSistemaClinico.sol";

contract CapaAdministrativa is BaseSistemaClinico {

    mapping(address => bool) internal administrativos;

    /**
    * @notice Comprueba que el sender sea un administrativo del sistema
    */
    modifier onlyAdministrativo() {
        require(administrativos[msg.sender], "Esta operacion solo puede realizarla un administrativo del sistema");
        _;
    }

    /**
    * @notice Comprueba que la direccion pasada corresponde a un administrativo del sistema
    * @param _administrativoToTest La direccion a comprobar
    */
    modifier onlyOverAdministrativo(address _administrativoToTest) {
        require(administrativos[_administrativoToTest], "Esta operacion solo puede ser realizada sobre un administrativo del sistema");
        _;
    }

    /****************************************************************************************/
    /********************************* ADMINISTRATIVOS **************************************/
    /****************************************************************************************/

    /**
    * @notice Da de alta un nuevo administrativo en el sistema
    * @param _administrativoToAdd La direccion del administrativo que se va a dar de alta
    */
    function addAdministrativo(address _administrativoToAdd) public onlyOwner {
        require(!administrativos[_administrativoToAdd], "El administrativo ya pertenece al sistema");
        administrativos[_administrativoToAdd] = true;
        datos.addAdministrativo(_administrativoToAdd);
    }

    /**
    * @notice Da de baja un administrativo en el sistema
    * @param _administrativoToRemove La direccion del administrativo que se va a dar de baja
    */
    function removeAdministrativo(address _administrativoToRemove) public onlyOwner onlyOverAdministrativo(_administrativoToRemove) {
        administrativos[_administrativoToRemove] = false;
        datos.removeAdministrativo(_administrativoToRemove);
    }

    /**
    * @notice Comprueba si una persona es administrativo
    * @param _supuestoAdministrativo La direccion del administrativo que hay que comprobar
    * @return Booleano que indica si es administrativo o no
    */
    function isAdministrativo(address _supuestoAdministrativo) public view onlyOwner returns (bool) {
        return administrativos[_supuestoAdministrativo];
    }

}
