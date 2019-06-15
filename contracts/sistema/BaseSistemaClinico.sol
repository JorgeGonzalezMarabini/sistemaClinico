pragma solidity ^0.4.25;

import "../Owned.sol";
import "../DatosSistemaClinico.sol";
import "../math/SafeMath.sol";
import "../utils/Arrays.sol";

contract BaseSistemaClinico is Owned {

    using SafeMath for uint;
    using Arrays for address[];

    DatosSistemaClinico internal datos;
}
