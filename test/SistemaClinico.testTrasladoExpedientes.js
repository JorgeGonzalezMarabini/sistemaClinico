const assert = require('assert');
const ganache = require("ganache-cli");

const Web3 = require('web3');
const web3 = new Web3();
web3.setProvider(ganache.provider({gasLimit: 1000000000, total_accounts: 6}));

const contracts = require('../compile');
const sistemaClinicoContract = contracts["SistemaClinico.sol"].SistemaClinico;
const datosContract = contracts["DatosSistemaClinico.sol"].DatosSistemaClinico;

let accounts;
let sistemaClinico;
let datosSistemaClinico;

let sistemaAddress;
let datosSistemaAddress;

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
    //Asignamos al sistema el contrato de los datos
    await sistemaClinico.methods.setDatosAddress(datosSistemaAddress).send({from: ownerAddress});
    //Aniadimos un nuevo administrativo
    await sistemaClinico.methods.addAdministrativo(administrativoAddress).send({from: ownerAddress, gas: '9000000'});
    //Aniadimos los medicos
    await sistemaClinico.methods.addMedico(medicoAddress).send({from: administrativoAddress});
    await sistemaClinico.methods.addMedico(otherMedicoAddress).send({from: administrativoAddress});
    //Aniadimos los expedientes
    await sistemaClinico.methods.addExpediente(paciente1Address, 2345).send({from: medicoAddress, gas: '9000000'});
    await sistemaClinico.methods.addExpediente(paciente2Address, 2345).send({from: medicoAddress, gas: '9000000'});
});

describe('SistemaClinico-TrasladoExpedientes', () => {

    it('primisas del test', async () => {
        assert.ok(sistemaAddress);
        assert.ok(datosSistemaAddress);
        assert.ok(await sistemaClinico.methods.isAdministrativo(administrativoAddress).call({from: ownerAddress}));
        assert.ok(await sistemaClinico.methods.isMedico(medicoAddress).call({from: administrativoAddress}));
        assert.ok(await sistemaClinico.methods.isMedico(otherMedicoAddress).call({from: administrativoAddress}));
        assert.ok(await sistemaClinico.methods.isPaciente(paciente1Address).call({from: medicoAddress}));
        assert.ok(await sistemaClinico.methods.isPaciente(paciente2Address).call({from: medicoAddress}));
    });

    /******************************** TRASLADA EXPEDIENTES **************************************/

    it('transfiere expedientes', async () => {
        var pacientesMedicoBefore = await sistemaClinico.methods.getPacientesFromMedico(medicoAddress).call({from: medicoAddress, gas: '9000000'});
        var pacientesOtherMedicoBefore = await sistemaClinico.methods.getPacientesFromMedico(otherMedicoAddress).call({from: otherMedicoAddress, gas: '9000000'});
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

        //Transferimos los expedientes a un nuevo medico
        var result = await sistemaClinico.methods.transfiereExpedientes(medicoAddress, otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'});

        //Comprobamos los eventos
        const eventoExp1 = result.events.TrasladoExpediente[0];
        assert.strictEqual(eventoExp1.returnValues._newMedico, otherMedicoAddress);
        assert.strictEqual(eventoExp1.returnValues._oldMedico, medicoAddress);
        assert.strictEqual(eventoExp1.returnValues._paciente, paciente1Address);
        const eventoExp2 = result.events.TrasladoExpediente[1];
        assert.strictEqual(eventoExp2.returnValues._newMedico, otherMedicoAddress);
        assert.strictEqual(eventoExp2.returnValues._oldMedico, medicoAddress);
        assert.strictEqual(eventoExp2.returnValues._paciente, paciente2Address);
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
});