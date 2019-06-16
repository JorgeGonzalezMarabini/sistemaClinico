pragma solidity ^0.4.25;

import "./BaseSistemaClinico.sol";
import "../sistemaInterface/CapaAdministrativaInterface.sol";

contract CapaAdministrativa is BaseSistemaClinico, CapaAdministrativaInterface {

    /**
    * @notice Constructor del contrato
    * @param _sistemaClinico La direccion del sistema clinico
    * @param _datos La direccion del contrato de los datos
    */
    constructor(address _sistemaClinico, address _datos) public BaseSistemaClinico(_sistemaClinico, _datos) {}

    /**
    * @notice Da de alta un nuevo administrativo en el sistema
    * @param _administrativoToAdd La direccion del administrativo que se va a dar de alta
    */
    function addAdministrativo(address _administrativoToAdd, address _oriCaller) public onlySistema onlyCrossOwner(_oriCaller) {
        datos.addAdministrativo(_administrativoToAdd);
    }

    /**
    * @notice Da de baja un administrativo en el sistema
    * @param _administrativoToRemove La direccion del administrativo que se va a dar de baja
    */
    function removeAdministrativo(address _administrativoToRemove, address _oriCaller) public onlySistema onlyCrossOwner(_oriCaller) {
        datos.removeAdministrativo(_administrativoToRemove);
    }

    /**
    * @notice Comprueba si una persona es administrativo
    * @param _supuestoAdministrativo La direccion del administrativo que hay que comprobar
    * @return Booleano que indica si es administrativo o no
    */
    function isAdministrativo(address _supuestoAdministrativo, address _oriCaller) public view onlySistema onlyCrossOwner(_oriCaller) returns (bool) {
        return datos.isAdministrativo(_supuestoAdministrativo);
    }

}
