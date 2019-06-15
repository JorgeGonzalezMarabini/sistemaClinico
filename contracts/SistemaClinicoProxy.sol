pragma solidity ^0.4.25;

import "./Owned.sol";

contract SistemaClinicoProxy is Owned {

    address public sistemaClinicoAddress;

    constructor(address _sistemaClinicoAddress) public {
        sistemaClinicoAddress = _sistemaClinicoAddress;
    }

    function updateSistemaClinicoAddress(address _sistemaClinicoAddress) public onlyOwner {
        sistemaClinicoAddress = _sistemaClinicoAddress;
    }
}
