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
let medicoAddress;
let pacienteAddress;
let administrativoAddress;

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
    medicoAddress = accounts[2];
    pacienteAddress = accounts[3];
    administrativoAddress = accounts[4];

    // Use one of those accounts to deploy the contract
    datosSistemaClinico = await new web3.eth.Contract(datosContract.abi)
            .deploy({
                data: datosContract.evm.bytecode.object,
                arguments: [sistemaAddress]
            })
            .send({from: ownerAddress, gas: '100000000'});
});

describe('DatosSistemaClinico', () => {

    it('desplegar el contrato', async () => {
        assert.ok(datosSistemaClinico.options.address);
        assert.strictEqual(await datosSistemaClinico.methods.getSistemaClinico().call({from: ownerAddress}), sistemaAddress);
    });

    /******************************** MEDICOS **************************************/

    it('add medico', async () => {
        await datosSistemaClinico.methods.addMedico(medicoAddress).send({from: sistemaAddress, gas: '9000000'});
        const medicos = await datosSistemaClinico.methods.getMedicosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 1);
        assert.strictEqual(medicos[0], medicoAddress);
    });

    it('add medico error', async () => {
        assert.ok(
                await assertException(async () => { await datosSistemaClinico.methods.addMedico(medicoAddress).send({from: ownerAddress, gas: '9000000'})}),
                "Solo el sistema clinico puede aniadir nuevos medicos"
        );
    });

    it('remove medico', async () => {
        await datosSistemaClinico.methods.removeMedico(medicoAddress).send({from: sistemaAddress, gas: '9000000'});
        const medicos = await datosSistemaClinico.methods.getMedicosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 0);
    });

    it('remove medico error', async () => {
        assert.ok(
                await assertException(async () => { await datosSistemaClinico.methods.removeMedico(medicoAddress).send({from: ownerAddress, gas: '9000000'})}),
                "Solo el sistema clinico puede borrar medicos"
        );
    });

    /******************************** PACIENTES **************************************/

    it('add paciente', async () => {
        await datosSistemaClinico.methods.addPaciente(pacienteAddress, ownerAddress).send({from: sistemaAddress, gas: '9000000'});
        const pacientes = await datosSistemaClinico.methods.getPacientesList().call({from: ownerAddress});
        assert.strictEqual(pacientes.length, 1);
        assert.strictEqual(pacientes[0], pacienteAddress);
    });

    it('add paciente error', async () => {
        assert.ok(
                await assertException(async () => { await datosSistemaClinico.methods.addPaciente(pacienteAddress).send({from: ownerAddress, gas: '9000000'})}),
                "Solo el sistema clinico puede aniadir nuevos pacientes"
        );
    });

    /******************************** ADMINISTRATIVO **************************************/

    it('add administrativo', async () => {
        await datosSistemaClinico.methods.addAdministrativo(administrativoAddress).send({from: sistemaAddress, gas: '9000000'});
        const administrativos = await datosSistemaClinico.methods.getAdministrativosList().call({from: ownerAddress});
        assert.strictEqual(administrativos.length, 1);
        assert.strictEqual(administrativos[0], administrativoAddress);
    });

    it('add administrativo error', async () => {
        assert.ok(
                await assertException(async () => { await datosSistemaClinico.methods.addAdministrativo(administrativoAddress).send({from: ownerAddress, gas: '9000000'})}),
                "Solo el sistema clinico puede aniadir nuevos administrativos"
        );
    });

    it('remove administrativo', async () => {
        await datosSistemaClinico.methods.removeAdministrativo(administrativoAddress).send({from: sistemaAddress, gas: '9000000'});
        const medicos = await datosSistemaClinico.methods.getAdministrativosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 0);
    });
    
    it('remove administrativo error', async () => {
        assert.ok(
                await assertException(async () => { await datosSistemaClinico.methods.removeAdministrativo(administrativoAddress).send({from: ownerAddress, gas: '9000000'})}),
                "Solo el sistema clinico puede borrar medicos"
        );
    });

});