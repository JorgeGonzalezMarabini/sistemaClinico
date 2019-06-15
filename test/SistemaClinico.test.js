const assert = require('assert');
const ganache = require("ganache-cli");

const Web3 = require('web3');
const web3 = new Web3();
web3.setProvider(ganache.provider({gasLimit: 1000000000}));

const contracts = require('../compile');
const sistemaClinicoContract = contracts["SistemaClinico.sol"].SistemaClinico;
const datosContract = contracts["DatosSistemaClinico.sol"].DatosSistemaClinico;

let accounts;
let sistemaClinico;
let datosSistemaClinico;

let ownerAddress;

before(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();

    ownerAddress = accounts[0];

    // Use one of those accounts to deploy the contract
    sistemaClinico = await new web3.eth.Contract(sistemaClinicoContract.abi)
            .deploy({
                data: sistemaClinicoContract.evm.bytecode.object,
            })
            .send({from: ownerAddress, gas: '100000000'});

    // Use one of those accounts to deploy the contract
    datosSistemaClinico = await new web3.eth.Contract(datosContract.abi)
            .deploy({
                data: datosContract.evm.bytecode.object,
                arguments: [accounts[1]]
            })
            .send({from: ownerAddress, gas: '3000000'});
});

describe('SistemaClinico', () => {

    it('desplegar el contrato', () => {
        // assert.ok(sistemaClinico.options.address);
        assert.ok(datosSistemaClinico.options.address);
    });

});