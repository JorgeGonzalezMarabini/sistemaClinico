const assert = require('assert');
const ganache = require("ganache-cli");

const Web3 = require('web3');
const web3 = new Web3();
web3.setProvider(ganache.provider({gasLimit: 1000000000}));

const contracts = require('../compile');
const datosContract = contracts["DatosSistemaClinico.sol"].DatosSistemaClinico;

let accounts;
let datosSistemaClinico;

let ownerAddress;
let sistemaAddress;
let address1;
let address2;
let servicioSistemaAddress;

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
    address1 = accounts[2];
    address2 = accounts[3];
    servicioSistemaAddress = accounts[4];

    // Use one of those accounts to deploy the contract
    datosSistemaClinico = await new web3.eth.Contract(datosContract.abi)
            .deploy({
                data: datosContract.evm.bytecode.object,
                arguments: [sistemaAddress]
            })
            .send({from: ownerAddress, gas: '100000000'});
});

describe('DatosSistemaClinico-CasosBorrado', () => {

    it('desplegar el contrato', async () => {
        assert.ok(datosSistemaClinico.options.address);
        await datosSistemaClinico.methods.addServicioSistemaClinico(servicioSistemaAddress).send({from: ownerAddress, gas: '9000000'});
    });

    /******************************** MEDICOS PRUEBA BORRADO 1 **************************************/

    it('add medicos for borrado ordenado', async () => {
        await datosSistemaClinico.methods.addMedico(address1).send({from: servicioSistemaAddress});
        await datosSistemaClinico.methods.addMedico(address2).send({from: servicioSistemaAddress});
        const medicos = await datosSistemaClinico.methods.getMedicosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 2);
        assert.strictEqual(medicos[0], address1);
        assert.strictEqual(medicos[1], address2);
    });

    it('remove medico 1 borrado ordenado', async () => {
        await datosSistemaClinico.methods.removeMedico(address1).send({from: servicioSistemaAddress});
        const medicos = await datosSistemaClinico.methods.getMedicosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 1);
        assert.strictEqual(medicos[0], address2);
    });

    it('remove medico 2 borrado ordenado', async () => {
        await datosSistemaClinico.methods.removeMedico(address2).send({from: servicioSistemaAddress});
        const medicos = await datosSistemaClinico.methods.getMedicosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 0);
    });

    /******************************** MEDICOS PRUEBA BORRADO 2 **************************************/

    it('add medicos for borrado desordenado', async () => {
        await datosSistemaClinico.methods.addMedico(address1).send({from: servicioSistemaAddress});
        await datosSistemaClinico.methods.addMedico(address2).send({from: servicioSistemaAddress});
        const medicos = await datosSistemaClinico.methods.getMedicosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 2);
        assert.strictEqual(medicos[0], address1);
        assert.strictEqual(medicos[1], address2);
    });

    it('remove medico 2 borrado desordenado', async () => {
        await datosSistemaClinico.methods.removeMedico(address2).send({from: servicioSistemaAddress});
        const medicos = await datosSistemaClinico.methods.getMedicosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 1);
        assert.strictEqual(medicos[0], address1);
    });
    
    it('remove medico 1 borrado desordenado', async () => {
        await datosSistemaClinico.methods.removeMedico(address1).send({from: servicioSistemaAddress});
        const medicos = await datosSistemaClinico.methods.getMedicosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 0);
    });

    /******************************** ADMINISTRATIVO PRUEBA BORRADO 1 **************************************/

    it('add administrativos', async () => {
        await datosSistemaClinico.methods.addAdministrativo(address1).send({from: servicioSistemaAddress});
        await datosSistemaClinico.methods.addAdministrativo(address2).send({from: servicioSistemaAddress});
        const administrativos = await datosSistemaClinico.methods.getAdministrativosList().call({from: ownerAddress});
        assert.strictEqual(administrativos.length, 2);
        assert.strictEqual(administrativos[0], address1);
        assert.strictEqual(administrativos[1], address2);
    });

    it('remove administrativo 1', async () => {
        await datosSistemaClinico.methods.removeAdministrativo(address1).send({from: servicioSistemaAddress});
        const administrativos = await datosSistemaClinico.methods.getAdministrativosList().call({from: ownerAddress});
        assert.strictEqual(administrativos.length, 1);
        assert.strictEqual(administrativos[0], address2);
    });

    it('remove administrativo 2', async () => {
        await datosSistemaClinico.methods.removeAdministrativo(address2).send({from: servicioSistemaAddress});
        const administrativos = await datosSistemaClinico.methods.getAdministrativosList().call({from: ownerAddress});
        assert.strictEqual(administrativos.length, 0);
    });

    /******************************** ADMINISTRATIVO PRUEBA BORRADO 2 **************************************/

    it('add administrativos', async () => {
        await datosSistemaClinico.methods.addAdministrativo(address1).send({from: servicioSistemaAddress});
        await datosSistemaClinico.methods.addAdministrativo(address2).send({from: servicioSistemaAddress});
        const administrativos = await datosSistemaClinico.methods.getAdministrativosList().call({from: ownerAddress});
        assert.strictEqual(administrativos.length, 2);
        assert.strictEqual(administrativos[0], address1);
        assert.strictEqual(administrativos[1], address2);
    });

    it('remove administrativo 2', async () => {
        await datosSistemaClinico.methods.removeAdministrativo(address2).send({from: servicioSistemaAddress});
        const administrativos = await datosSistemaClinico.methods.getAdministrativosList().call({from: ownerAddress});
        assert.strictEqual(administrativos.length, 1);
        assert.strictEqual(administrativos[0], address1);
    });

    it('remove administrativo 1', async () => {
        await datosSistemaClinico.methods.removeAdministrativo(address1).send({from: servicioSistemaAddress});
        const administrativos = await datosSistemaClinico.methods.getAdministrativosList().call({from: ownerAddress});
        assert.strictEqual(administrativos.length, 0);
    });

});