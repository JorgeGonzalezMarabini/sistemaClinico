pragma solidity ^0.4.25;

import "../Owned.sol";
import "../DatosSistemaClinico.sol";
import "../math/SafeMath.sol";
import "../utils/Arrays.sol";

contract BaseSistemaClinico is Owned {

    using SafeMath for uint;
    using Arrays for address[];

    address internal sistemaClinico;
    DatosSistemaClinico internal datos;

    /**
    * @notice Constructor del contrato
    * @param _sistemaClinico La direccion del sistema clinico
    * @param _datos La direccion del contrato de los datos
    */
    constructor(address _sistemaClinico, address _datos) public {
        sistemaClinico = _sistemaClinico;
        datos = DatosSistemaClinico(_datos);
    }

    /**
    * @notice Comprueba que el sender sea el propietario
    * @param _owner La direccion del owner a comprobar
    */
    modifier onlyCrossOwner(address _owner) {
        require(_owner == owner, "Solo el propietario puede realizar esta operacion xxx");
        _;
    }

    /**
    * @notice Comprueba que el sender sea un medico del sistema
    */
    modifier onlySistema() {
        require(msg.sender == sistemaClinico, "Esta operacion solo puede ser realizada desde el sistema");
        _;
    }

    /**
    * @notice Comprueba que el sender sea un administrativo del sistema
    * @param _administrativo La direccion del administrativo a comprobar
    */
    modifier onlyCrossAdministrativo(address _administrativo) {
        require(datos.isAdministrativo(_administrativo), "Esta operacion solo puede realizarla un administrativo del sistema");
        _;
    }

    /**
    * @notice Comprueba que la direccion pasada corresponde a un medico del sistema
    * @param _medico La direccion del medico a comprobar
    */
    modifier onlyCrossMedico(address _medico) {
        require(datos.isMedico(_medico), "Esta operacion solo puede realizarla un medico del sistema");
        _;
    }

    /****************************************************************************************/
    /************************************ SISTEMA *******************************************/
    /****************************************************************************************/

    /**
    * @notice Establece la direccion del contrato con los datos del sistema
    * @param _datosAddress La direccion del contrato con los datos
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
