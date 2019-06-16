const assert = require('assert');
const ganache = require("ganache-cli");

const Web3 = require('web3');
const web3 = new Web3();
web3.setProvider(ganache.provider({gasLimit: 1000000000, total_accounts: 6}));

const contracts = require('../compile');
const sistemaClinicoContract = contracts["SistemaClinico.sol"].SistemaClinico;
const datosContract = contracts["DatosSistemaClinico.sol"].DatosSistemaClinico;
const adminContract = contracts["sistema/CapaAdministrativa.sol"].CapaAdministrativa;
const medicosContract = contracts["sistema/CapaMedicos.sol"].CapaMedicos;
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

    //Desplegamos el sistema clinico
    sistemaClinico = await new web3.eth.Contract(sistemaClinicoContract.abi)
            .deploy({
                data: sistemaClinicoContract.evm.bytecode.object,
            })
            .send({from: ownerAddress, gas: '100000000'});
    sistemaAddress = sistemaClinico.options.address;
    //Desplegamos los datos del sistema clinico
    datosSistemaClinico = await new web3.eth.Contract(datosContract.abi)
            .deploy({
                data: datosContract.evm.bytecode.object,
                arguments: [sistemaAddress]
            })
            .send({from: ownerAddress, gas: '3000000'});
    datosSistemaAddress = datosSistemaClinico.options.address;
    //Desplegamos la capa administrativa
    capaAdministrativa = await new web3.eth.Contract(adminContract.abi)
                .deploy({
                    data: adminContract.evm.bytecode.object,
                    arguments: [sistemaAddress, datosSistemaAddress]
                })
                .send({from: ownerAddress, gas: '3000000'});
    capaAdministrativaAddress = capaAdministrativa.options.address;
    //Desplegamos la capa medicos
    capaMedicos = await new web3.eth.Contract(medicosContract.abi)
                .deploy({
                    data: medicosContract.evm.bytecode.object,
                    arguments: [sistemaAddress, datosSistemaAddress]
                })
                .send({from: ownerAddress, gas: '3000000'});
    capaMedicosAddress = capaMedicos.options.address;
    //Desplegamos la capa expedientes
    capaExpedientes = await new web3.eth.Contract(expedientesContract.abi)
                .deploy({
                    data: expedientesContract.evm.bytecode.object,
                    arguments: [sistemaAddress, datosSistemaAddress]
                })
                .send({from: ownerAddress, gas: '30000000'});
    capaExpedientesAddress = capaExpedientes.options.address;
});

describe('SistemaClinico-Medicos', () => {

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
        //Informamos al sisitema clinico de la capa de servicios
        await sistemaClinico.methods.setCapaAdministrativa(capaAdministrativaAddress).send({from: ownerAddress, gas: '9000000'});
        await sistemaClinico.methods.setCapaMedicos(capaMedicosAddress).send({from: ownerAddress, gas: '9000000'});
        await sistemaClinico.methods.setCapaExpedientes(capaExpedientesAddress).send({from: ownerAddress, gas: '9000000'});
        //Aniadimos un nuevo administrativo
        await sistemaClinico.methods.addAdministrativo(administrativoAddress).send({from: ownerAddress, gas: '100000000'});
        assert.ok(await sistemaClinico.methods.isAdministrativo(administrativoAddress).call({from: ownerAddress}));
    });

    /******************************** ADD MEDICO **************************************/

    it('add medico', async () => {
        await sistemaClinico.methods.addMedico(medicoAddress).send({from: administrativoAddress, gas: '9000000'});
        await sistemaClinico.methods.addMedico(otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'});
        //Comprobamos que en el sistema se ha almacenado correctamente
        assert.ok(await sistemaClinico.methods.isMedico(medicoAddress).call({from: administrativoAddress}));
        assert.ok(await sistemaClinico.methods.isMedico(otherMedicoAddress).call({from: administrativoAddress}));
        //Comprobamos que en los datos se ha almacenado correctamente
        const medicos = await datosSistemaClinico.methods.getMedicosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 2);
        assert.strictEqual(medicos[0], medicoAddress);
        assert.strictEqual(medicos[1], otherMedicoAddress);
    });

    /******************************** ADD MEDICO ERRORS **************************************/

    it('add medico error onlyAdministrativo', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addMedico(administrativoAddress).send({from: medicoAddress, gas: '9000000'})}),
                "Solo un administrativo del sistema clinico puede dar de alta nuevos medicos"
        );
    });

    it('add medico error onlyNotSistemaMedicos', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addMedico(medicoAddress).send({from: administrativoAddress, gas: '9000000'})}),
                "No se pueden dar de alta medicos que ya existan en el sistema"
        );
    });

    /******************************** REMOVE MEDICO WITH EXPEDIENTE ERRORS **************************************/

    it('add expedientes to medico for remove', async () => {
        //Aniadimos los expedientes
        await sistemaClinico.methods.addExpediente(pacienteAddress, 2345).send({from: medicoAddress, gas: '9000000'});
        await sistemaClinico.methods.addExpediente(administrativoAddress, 2345).send({from: medicoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isPaciente(pacienteAddress).call({from: medicoAddress}));
        assert.ok(await sistemaClinico.methods.isPaciente(administrativoAddress).call({from: medicoAddress}));
    });

    it('remove medico error onlyOverMedicoTo', async () => {
        assert.ok(await sistemaClinico.methods.isMedico(otherMedicoAddress).call({from: administrativoAddress}));
        assert.ok(!await sistemaClinico.methods.isMedico(unknownAddress).call({from: administrativoAddress}));
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.removeMedico(medicoAddress, unknownAddress).send({from: administrativoAddress, gas: '9000000'}) }),
                "Solo se pueden traspasar los expedientes a un medico del sistema"
        );
    });

    /******************************** REMOVE MEDICO WITH EXPEDIENTE **************************************/

    it('remove medico with expedientes', async () => {
        await sistemaClinico.methods.removeMedico(medicoAddress, otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'});
        assert.ok(!await sistemaClinico.methods.isMedico(medicoAddress).call({from: administrativoAddress}));
        //Comprobamos que los expedientes han sido trasladados al nuevo medico
        var expPaciente = await sistemaClinico.methods.getExpediente(pacienteAddress).call({from: otherMedicoAddress});
        var expAdministrativo = await sistemaClinico.methods.getExpediente(administrativoAddress).call({from: otherMedicoAddress});
        assert.strictEqual(expPaciente.medicoAsignado, otherMedicoAddress);
        assert.strictEqual(expAdministrativo.medicoAsignado, otherMedicoAddress);
    });

    /******************************** REMOVE MEDICO ERRORS **************************************/

    it('add medico for remove', async () => {
        //Aniadimos al medico
        await sistemaClinico.methods.addMedico(medicoAddress).send({from: administrativoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isMedico(medicoAddress).call({from: administrativoAddress}));
    });

    it('remove medico error onlyAdministrativo', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.removeMedico(medicoAddress, otherMedicoAddress).send({from: ownerAddress, gas: '9000000'}) }),
                "Solo un administrativo del sistema clinico puede dar de baja medicos"
        );
    });

    it('remove medico error onlyOverMedicoFrom', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.removeMedico(unknownAddress, medicoAddress).send({from: administrativoAddress, gas: '9000000'}) }),
                "Solo se pueden borrar medicos del sistema"
        );
    });

    /******************************** REMOVE MEDICO **************************************/

    it('remove medico', async () => {
        //Comprobamos que en el sistema se ha borrado correctamente
        await sistemaClinico.methods.removeMedico(medicoAddress, otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'});
        assert.ok(!await sistemaClinico.methods.isMedico(medicoAddress).call({from: administrativoAddress}));
        //Comprobamos que en los datos se ha borrado correctamente
        const medicos = await datosSistemaClinico.methods.getMedicosList().call({from: ownerAddress});
        assert.strictEqual(medicos.length, 1);
        assert.strictEqual(medicos[0], otherMedicoAddress);
        assert.ok(!await datosSistemaClinico.methods.isMedico(medicoAddress).call({from: capaAdministrativaAddress}));
    });



});