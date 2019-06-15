pragma solidity ^0.4.25;

import "./sistema/CapaTratamientos.sol";

contract SistemaClinico is CapaTratamientos {

    /****************************************************************************************/
    /************************************ SISTEMA *******************************************/
    /****************************************************************************************/

    /**
    * @notice Establece la direccion del contrato con los datos del sistema
    */
    function setDatosAddress(address _datosAddress) public onlyOwner {
        datos = DatosSistemaClinico(_datosAddress);
    }

    /**
    * @notice Retorna la direccion del contrato con los datos del sistema
    * @return La direccion del contrato con los datos
    */
    function getDatosAddress() public view onlyOwner returns (address) {
        return datos;
    }
}