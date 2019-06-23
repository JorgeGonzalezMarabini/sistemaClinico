const assert = require('assert');
const ganache = require("ganache-cli");

const Web3 = require('web3');
const web3 = new Web3();
web3.setProvider(ganache.provider({gasLimit: 1000000000, total_accounts: 10}));

const contracts = require('../compile');
// const sistemaClinicoContract = contracts["SistemaClinico.sol"].SistemaClinico;
const datosContract = contracts["DatosSistemaClinico.sol"].DatosSistemaClinico;
// const adminContract = contracts["sistema/CapaAdministrativa.sol"].CapaAdministrativa;
// const medicosContract = contracts["sistema/CapaMedicos.sol"].CapaMedicos;
const expedientesContract = contracts["sistema/CapaExpedientes.sol"].CapaExpedientes;

let accounts;
let sistemaClinico;
let datosSistemaClinico;
let capaAdministrativa;
let capaMedicos;
let capaExpedientes;

let sistemaAddress;
let datosSistemaAddress;
let capaAdministrativaAddress;
let capaMedicosAddress;
let capaExpedientesAddress;

let ownerAddress;
let medicoAddress;
let pacienteAddress;
let administrativoAddress;
let otherMedicoAddress;
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
    medicoAddress = accounts[1];
    administrativoAddress = accounts[2];
    otherMedicoAddress = accounts[3];
    pacienteAddress = accounts[4];
    unknownAddress = accounts[5];

    sistemaAddress = accounts[6];
    capaAdministrativaAddress = accounts[7];
    capaMedicosAddress = accounts[8];

    datosSistemaClinico = await new web3.eth.Contract(datosContract.abi)
            .deploy({
                data: datosContract.evm.bytecode.object,
                arguments: [sistemaAddress]
            })
            .send({from: ownerAddress, gas: '3000000'});
    datosSistemaAddress = datosSistemaClinico.options.address;
    //Desplegamos la capa expedientes
    capaExpedientes = await new web3.eth.Contract(expedientesContract.abi)
                .deploy({
                    data: expedientesContract.evm.bytecode.object,
                    arguments: [sistemaAddress, datosSistemaAddress]
                })
                .send({from: ownerAddress, gas: '30000000'});
    capaExpedientesAddress = capaExpedientes.options.address;
});

describe('Unitarios-CapaExpedientes', () => {

    it('desplegar los contratos', async () => {
        assert.ok(sistemaAddress);
        assert.ok(datosSistemaAddress);
        assert.ok(capaAdministrativaAddress);
        assert.ok(capaMedicosAddress);
        assert.ok(capaExpedientesAddress);
        //Agregamos la capa de servicios como servicios autorizados al acceso de los datos del sistema
        await datosSistemaClinico.methods.addServicioSistemaClinico(capaAdministrativaAddress).send({from: ownerAddress, gas: '9000000'});
        await datosSistemaClinico.methods.addServicioSistemaClinico(capaMedicosAddress).send({from: ownerAddress, gas: '9000000'});
        await datosSistemaClinico.methods.addServicioSistemaClinico(capaExpedientesAddress).send({from: ownerAddress, gas: '9000000'});
        //Aniadimos un nuevo administrativo
        await datosSistemaClinico.methods.addAdministrativo(administrativoAddress).send({from: capaAdministrativaAddress, gas: '100000000'});
        assert.ok(await datosSistemaClinico.methods.isAdministrativo(administrativoAddress).call({from: capaExpedientesAddress}));
    });

    /******************************** ADD MEDICO **************************************/

    // it('transfiere expedientes', async () => {
    //     await datosSistemaClinico.methods.addMedico(medicoAddress).send({from: capaAdministrativaAddress, gas: '9000000'});
    //     assert.ok(await datosSistemaClinico.methods.isMedico(medicoAddress).call({from: capaAdministrativaAddress}));
    //     await capaExpedientes.methods.transfiereExpedientes(medicoAddress, otherMedicoAddress, administrativoAddress).send({from: sistemaAddress, gas: '9000000'})
    // });
});