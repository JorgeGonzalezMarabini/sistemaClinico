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
});

describe('SistemaClinico-TrasladoExpediente', () => {

    it('primisas del test', async () => {
        assert.ok(sistemaAddress);
        assert.ok(datosSistemaAddress);
        //Asignamos al sistema el contrato de los datos
        await sistemaClinico.methods.setDatosAddress(datosSistemaAddress).send({from: ownerAddress, gas: '9000000'});
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
    });

    /******************************** TRASLADA EXPEDIENTE **************************************/

    it('transfiere expediente', async () => {
        var pacientesMedicoBefore = await sistemaClinico.methods.getPacientesFromMedico(medicoAddress).call({from: medicoAddress, gas: '9000000'});
        var pacientesOtherMedicoBefore = await sistemaClinico.methods.getPacientesFromMedico(otherMedicoAddress).call({from: otherMedicoAddress, gas: '9000000'});
        //Comprobamos los pacientes de los medicos antes del traslado
        assert.strictEqual(pacientesMedicoBefore.length, 2);
        assert.strictEqual(pacientesOtherMedicoBefore.length, 0);
        //Comprobamos que el medico es el asignado al expediente que vamos a transferir
        var expediente1Before = await sistemaClinico.methods.getExpediente(pacientesMedicoBefore[0]).call({from: medicoAddress});
        assert.strictEqual(expediente1Before.medicoAsignado, medicoAddress);
        assert.strictEqual(expediente1Before.titular, paciente1Address);
        var expediente2Before = await sistemaClinico.methods.getExpediente(pacientesMedicoBefore[1]).call({from: medicoAddress});
        assert.strictEqual(expediente2Before.medicoAsignado, medicoAddress);
        assert.strictEqual(expediente2Before.titular, paciente2Address);

        //Transferimos el expediente a un nuevo medico
        var result = await sistemaClinico.methods.transfiereExpediente(pacientesMedicoBefore[0], otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'});

        //Comprobamos el evento
        var evento = result.events.TrasladoExpediente;
        assert.strictEqual(evento.returnValues._newMedico, otherMedicoAddress);
        assert.strictEqual(evento.returnValues._oldMedico, medicoAddress);
        assert.strictEqual(evento.returnValues._paciente, paciente1Address);
        //Comprobamos el expediente tiene el nuevo medico asignado
        var expediente1After = await sistemaClinico.methods.getExpediente(pacientesMedicoBefore[0]).call({from: otherMedicoAddress});
        assert.strictEqual(expediente1After.medicoAsignado, otherMedicoAddress);
        //Comprobamos que el otro expediente no se ha cambiado
        var expediente2After = await sistemaClinico.methods.getExpediente(pacientesMedicoBefore[1]).call({from: medicoAddress});
        assert.strictEqual(expediente2After.medicoAsignado, medicoAddress);
        //Obtenemos los pacientes de ambos medicos despues de la transferencia
        var pacientesMedicoAfter = await sistemaClinico.methods.getPacientesFromMedico(medicoAddress).call({from: medicoAddress, gas: '9000000'});
        var pacientesOtherMedicoAfter = await sistemaClinico.methods.getPacientesFromMedico(otherMedicoAddress).call({from: otherMedicoAddress, gas: '9000000'});
        //Comprobamos que el medico anterior tiene un expediente menos asignado
        assert.strictEqual(pacientesMedicoAfter.length, 1);
        //Comprobamos que el nuevo medico tiene un expediente mas asignado
        assert.strictEqual(pacientesOtherMedicoAfter.length, 1);
        //Comprobamos que el paciente se ha asignado correctamente en el sistema
        assert.strictEqual(pacientesOtherMedicoAfter[0], pacientesMedicoBefore[0]);
        //Comprobamos que el paciente no trasladado sigue correctamente asignado en el sistema
        assert.strictEqual(pacientesMedicoAfter[0], pacientesMedicoBefore[1]);
    });

    /******************************** TRASLADA EXPEDIENTE ERRORS **************************************/

    it('transfiere expediente error onlyAdministrativo', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.transfiereExpediente(paciente2Address, otherMedicoAddress).send({from: medicoAddress, gas: '9000000'})}),
                "Solo un administrativo del sistema puede trasladar expedientes"
        );
    });

    it('transfiere expediente error mismoMedico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.transfiereExpediente(paciente2Address, medicoAddress).send({from: administrativoAddress, gas: '9000000'})}),
                "Solo se puede transferir un expediente a un medico distinto del actual"
        );
    });

    it('transfiere expediente error onlyPaciente', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.transfiereExpediente(medicoAddress, otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'})}),
                "Solo se pueden transferir expedientes pertenecientes al sistema"
        );
    });

    it('transfiere expediente error onlyOverMedico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.transfiereExpediente(paciente2Address, paciente1Address).send({from: administrativoAddress, gas: '9000000'})}),
                "Solo se pueden transferir expedientes a medicos del sistema"
        );
    });

});