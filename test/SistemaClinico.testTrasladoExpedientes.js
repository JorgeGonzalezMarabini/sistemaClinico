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
let paciente1Address;
let paciente2Address;
let administrativoAddress;
let otherMedicoAddress;

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
    paciente1Address = accounts[2];
    paciente2Address = accounts[3];
    administrativoAddress = accounts[4];
    otherMedicoAddress = accounts[5];

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

describe('SistemaClinico-TrasladoExpedientes', () => {

    let pacientesMedicoBefore;
    let pacientesOtherMedicoBefore;

    it('primisas del test', async () => {
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
        await sistemaClinico.methods.addAdministrativo(administrativoAddress).send({from: ownerAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isAdministrativo(administrativoAddress).call({from: ownerAddress}));
        //Aniadimos los medicos
        await sistemaClinico.methods.addMedico(medicoAddress).send({from: administrativoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isMedico(medicoAddress).call({from: administrativoAddress}));
        await sistemaClinico.methods.addMedico(otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isMedico(otherMedicoAddress).call({from: administrativoAddress}));
        //Aniadimos los expedientes
        await sistemaClinico.methods.addExpediente(paciente1Address, 2345).send({from: medicoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isPaciente(paciente1Address).call({from: medicoAddress}));
        await sistemaClinico.methods.addExpediente(paciente2Address, 2345).send({from: medicoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isPaciente(paciente2Address).call({from: medicoAddress}));
        //Comprobamos que los pacientes han sido correctamente asignados a los medicos
        pacientesMedicoBefore = await sistemaClinico.methods.getPacientesFromMedico(medicoAddress).call({from: medicoAddress, gas: '9000000'});
        pacientesOtherMedicoBefore = await sistemaClinico.methods.getPacientesFromMedico(otherMedicoAddress).call({from: otherMedicoAddress, gas: '9000000'});
        //Comprobamos que el medico tiene los 2 expediente
        assert.strictEqual(pacientesMedicoBefore.length,2);
        assert.strictEqual(pacientesOtherMedicoBefore.length,0);
        //Comprobamos que el medico es el asignado a los expedientes que vamos a transferir
        var expediente1Before = await sistemaClinico.methods.getExpediente(pacientesMedicoBefore[0]).call({from: medicoAddress});
        var expediente2Before = await sistemaClinico.methods.getExpediente(pacientesMedicoBefore[1]).call({from: medicoAddress});
        assert.strictEqual(expediente1Before.medicoAsignado, medicoAddress);
        assert.strictEqual(expediente1Before.titular, paciente1Address);
        assert.strictEqual(expediente2Before.medicoAsignado, medicoAddress);
        assert.strictEqual(expediente2Before.titular, paciente2Address);

    });

    /******************************** TRASLADA EXPEDIENTES ERRORS **************************************/

    it('transfiere expedientes error onlyAdministrativo', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.transfiereExpedientes(otherMedicoAddress).send({from: medicoAddress, gas: '9000000'})}),
                "Solo un administrativo del sistema puede trasladar expedientes"
        );
    });

    it('transfiere expedientes error mismoMedico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.transfiereExpedientes(medicoAddress, medicoAddress).send({from: administrativoAddress, gas: '9000000'})}),
                "Solo se puede transferir un expediente a un medico distinto del actual"
        );
    });

    it('transfiere expedientes error onlyOverMedicoTo', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.transfiereExpedientes(medicoAddress, paciente1Address).send({from: administrativoAddress, gas: '9000000'})}),
                "Solo se pueden transferir expedientes a medicos del sistema"
        );
    });

    it('transfiere expedientes error onlyOverMedicoFrom', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.transfiereExpedientes(paciente2Address, otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'})}),
                "Solo se pueden transferir expedientes de medicos del sistema"
        );
    });

    /******************************** TRASLADA EXPEDIENTES **************************************/

    it('transfiere expedientes', async () => {
        //Transferimos los expedientes a un nuevo medico
        var result = await sistemaClinico.methods.transfiereExpedientes(medicoAddress, otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'});

        //Comprobamos los eventos
        const eventoExp1 = web3.eth.abi.decodeParameters(['address', 'address', 'address', 'address'], result.events['0'].raw.data);
        assert.strictEqual(eventoExp1['0'], paciente1Address);
        assert.strictEqual(eventoExp1['1'], medicoAddress);
        assert.strictEqual(eventoExp1['2'], otherMedicoAddress);
        assert.strictEqual(eventoExp1['3'], administrativoAddress);
        const eventoExp2 = web3.eth.abi.decodeParameters(['address', 'address', 'address', 'address'], result.events['1'].raw.data);
        assert.strictEqual(eventoExp2['0'], paciente2Address);
        assert.strictEqual(eventoExp2['1'], medicoAddress);
        assert.strictEqual(eventoExp2['2'], otherMedicoAddress);
        assert.strictEqual(eventoExp2['3'], administrativoAddress);
        //Obtenemos los pacientes de ambos medicos despues de la transferencia
        var pacientesMedicoAfter = await sistemaClinico.methods.getPacientesFromMedico(medicoAddress).call({from: medicoAddress, gas: '9000000'});
        var pacientesOtherMedicoAfter = await sistemaClinico.methods.getPacientesFromMedico(otherMedicoAddress).call({from: otherMedicoAddress, gas: '9000000'});
        //Comprobamos que el medico anterior tiene un expediente menos asignado
        assert.strictEqual(pacientesMedicoAfter.length, 0);
        //Comprobamos que el nuevo medico tiene un expediente mas asignado
        assert.strictEqual(pacientesOtherMedicoAfter.length, 2);
        //Comprobamos que el paciente se ha asignado correctamente en el sistema
        assert.strictEqual(pacientesOtherMedicoAfter[0], pacientesMedicoBefore[0]);
        assert.strictEqual(pacientesOtherMedicoAfter[1], pacientesMedicoBefore[1]);
        //Comprobamos que los expedientes tienen el nuevo medico asignado
        var expediente1After = await sistemaClinico.methods.getExpediente(pacientesMedicoBefore[0]).call({from: otherMedicoAddress});
        var expediente2After = await sistemaClinico.methods.getExpediente(pacientesMedicoBefore[1]).call({from: otherMedicoAddress});
        assert.strictEqual(expediente1After.medicoAsignado, otherMedicoAddress);
        assert.strictEqual(expediente2After.medicoAsignado, otherMedicoAddress);
    });
});