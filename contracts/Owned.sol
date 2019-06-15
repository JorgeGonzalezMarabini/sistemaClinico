pragma solidity ^0.4.25;

contract Owned {

    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);

    /**
    * @notice Constructor del contrato
    */
    constructor() public {
        owner = msg.sender;
    }

    /**
    * @notice Comprueba que el sender sea el propietario
    */
    modifier onlyOwner {
        require(msg.sender == owner, "Solo el propietario puede realizar esta operacion xxx");
        _;
    }

    /**
    * @notice Inicia el proceso de transferencia del contrato a un nuevo propietario
    * @param _newOwner La direccion del futuro propietario
    */
    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }

    /**
    * @notice Aceptacion del propietario propuesto
    */
    function acceptOwnership() public {
        require(msg.sender == newOwner);
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }
}