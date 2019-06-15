pragma solidity ^0.4.25;

import "./BaseSistemaClinico.sol";

contract CapaAdministrativa is BaseSistemaClinico {

    /**
    * @notice Comprueba que el sender sea un administrativo del sistema
    */
    modifier onlyAdministrativo() {
        require(datos.isAdministrativo(msg.sender), "Esta operacion solo puede realizarla un administrativo del sistema");
        _;
    }



    /**
    * @notice Da de alta un nuevo administrativo en el sistema
    * @param _administrativoToAdd La direccion del administrativo que se va a dar de alta
    */
    function addAdministrativo(address _administrativoToAdd) public onlyOwner {
        datos.addAdministrativo(_administrativoToAdd);
    }

    /**
    * @notice Da de baja un administrativo en el sistema
    * @param _administrativoToRemove La direccion del administrativo que se va a dar de baja
    */
    function removeAdministrativo(address _administrativoToRemove) public onlyOwner {
        datos.removeAdministrativo(_administrativoToRemove);
    }

    /**
    * @notice Comprueba si una persona es administrativo
    * @param _supuestoAdministrativo La direccion del administrativo que hay que comprobar
    * @return Booleano que indica si es administrativo o no
    */
    function isAdministrativo(address _supuestoAdministrativo) public view onlyOwner returns (bool) {
        return datos.isAdministrativo(_supuestoAdministrativo);
    }

}
