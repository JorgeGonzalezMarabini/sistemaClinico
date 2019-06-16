pragma solidity ^0.4.25;

import "./BaseSistemaClinico.sol";
import "../sistemaInterface/CapaMedicosInterface.sol";

contract CapaMedicos is BaseSistemaClinico, CapaMedicosInterface {

    /**
    * @notice Constructor del contrato
    * @param _sistemaClinico La direccion del sistema clinico
    * @param _datos La direccion del contrato de los datos
    */
    constructor(address _sistemaClinico, address _datos) public BaseSistemaClinico(_sistemaClinico, _datos) {}

    /**
    * @notice Da de alta un nuevo medico al sistema
    * @param _medicoToAdd La direccion del medico que se va a dar de alta
    */
    function addMedico(address _medicoToAdd, address _oriCaller) public onlySistema onlyCrossAdministrativo(_oriCaller) {
        datos.addMedico(_medicoToAdd);
    }

    /**
    * @notice Da de baja a un medico transferiendo todos sus expedientes a otro
    * @param _medicoToRemove La direccion del medico que se va a dar de baja
    */
    function removeMedico(address _medicoToRemove, address _oriCaller) public onlySistema onlyCrossAdministrativo(_oriCaller) {
        datos.removeMedico(_medicoToRemove);
    }

    /**
    * @notice Comprueba si una persona es medico
    * @param _supuestoMedico La direccion del medico que hay que comprobar
    * @return Booleano que indica si es medico o no
    */
    function isMedico(address _supuestoMedico, address _oriCaller) public view onlySistema onlyCrossAdministrativo(_oriCaller) returns (bool) {
        return datos.isMedico(_supuestoMedico);
    }
}
