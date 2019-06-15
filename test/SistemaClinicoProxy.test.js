const assert = require('assert');
const ganache = require("ganache-cli");

const Web3 = require('web3');
const web3 = new Web3();
web3.setProvider(ganache.provider({gasLimit: 1000000000}));

const {abi, evm} = require('../compile')["SistemaClinicoProxy.sol"].SistemaClinicoProxy;

let accounts;
let sistemaClinicoProxy;

let ownerAddress;
let sistemaAddress;
let unknownAddress;

async function assertException(funcion) {
    let error = false;
    try {
        await funcion();
    } catch (e) {
        error = true;
    }
    return error;
}

before(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();

    ownerAddress = accounts[0];
    sistemaAddress = accounts[1];
    unknownAddress = accounts[2];

    // Use one of those accounts to deploy the contract
    sistemaClinicoProxy = await new web3.eth.Contract(abi)
            .deploy({
                data: evm.bytecode.object,
                arguments: [sistemaAddress]
            })
            .send({from: ownerAddress, gas: '100000000'});
});

describe('SistemaClinicoProxy', () => {

    it('desplegar el contrato', () => {
        assert.ok(sistemaClinicoProxy.options.address);
    });

    it('obtener direccion sistema', async () => {
        assert.strictEqual(await sistemaClinicoProxy.methods.sistemaClinicoAddress().call({from: unknownAddress}), sistemaAddress);
    });

    it('cambiar direccion sistema', async () => {
        await sistemaClinicoProxy.methods.updateSistemaClinicoAddress(unknownAddress).send({from: ownerAddress});
        assert.strictEqual(await sistemaClinicoProxy.methods.sistemaClinicoAddress().call({from: unknownAddress}), unknownAddress);
    });

    it('cambiar direccion sistema error', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinicoProxy.methods.updateSistemaClinicoAddress(sistemaAddress).send({from: unknownAddress})}),
                "Solo el propietario puede cambiar la direccion del sistema"
        );
    });
    
});