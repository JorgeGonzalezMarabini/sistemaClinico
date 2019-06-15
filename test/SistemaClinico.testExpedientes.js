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

let sistemaAddress;
let datosSistemaAddress;

let ownerAddress;
let medicoAddress;
let pacienteAddress;
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
    pacienteAddress = accounts[2];
    administrativoAddress = accounts[3];
    otherMedicoAddress = accounts[4];

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

describe('SistemaClinico-Expedientes', () => {

    it('primisas del test', async () => {
        assert.ok(sistemaAddress);
        assert.ok(datosSistemaAddress);
        //Asignamos al sistema el contrato de los datos
        await sistemaClinico.methods.setDatosAddress(datosSistemaAddress).send({from: ownerAddress, gas: '9000000'});
        //Aniadimos un nuevo administrativo
        await sistemaClinico.methods.addAdministrativo(administrativoAddress).send({from: ownerAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isAdministrativo(administrativoAddress).call({from: ownerAddress}));
        //Aniadimos al medico
        await sistemaClinico.methods.addMedico(medicoAddress).send({from: administrativoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isMedico(medicoAddress).call({from: administrativoAddress}));
        await sistemaClinico.methods.addMedico(otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isMedico(otherMedicoAddress).call({from: administrativoAddress}));
    });

    /******************************** ADD EXPEDIENTE **************************************/

    let tratamientoId;


    it('add expediente', async () => {
        const result = await sistemaClinico.methods.addExpediente(pacienteAddress, 2345).send({from: medicoAddress, gas: '9000000'});
        const resultTratamiento = await sistemaClinico.methods.addTratamientoToExpediente(pacienteAddress, "dolencia", "tratamiento").send({from: medicoAddress, gas: '9000000'});
        tratamientoId = web3.eth.abi.decodeParameters(['address', 'uint256'], resultTratamiento.events['0'].raw.data)['1'];
        //Comprobamos el evento
        var evento = result.events.AltaExpediente;
        //Comprobamos el evento
        assert.strictEqual(evento.returnValues._medico, medicoAddress);
        assert.strictEqual(evento.returnValues._paciente, pacienteAddress);
        //Comprobamos que el paciente se ha registrado correctamente en el sistema
        assert.ok(await sistemaClinico.methods.isPaciente(pacienteAddress).call({from: medicoAddress}));
        const pacientesFromMedico = await sistemaClinico.methods.getPacientesFromMedico(medicoAddress).call({from: medicoAddress});
        assert.strictEqual(pacientesFromMedico.length, 1);
        assert.strictEqual(pacientesFromMedico[0], pacienteAddress);
        //Comprobamos que el paciente se ha registrado correctamente en los datos
        const pacientes = await datosSistemaClinico.methods.getPacientesList().call({from: ownerAddress});
        assert.strictEqual(pacientes.length, 1);
        assert.strictEqual(pacientes[0], pacienteAddress);
    });

    /******************************** ADD EXPEDIENTE ERRORS **************************************/

    it('add expediente error onlyMedico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addExpediente(administrativoAddress, 2345).send({from: ownerAddress, gas: '9000000'})}),
                "Solo un medico del sistema puede aniadir nuevos expedientes"
        );
    });

    it('add expediente error notPacientesYet', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addExpediente(pacienteAddress, 2345).send({from: medicoAddress, gas: '9000000'})}),
                "Solo de pueden aniadir pacientes que no pertenezcan al sistema"
        );
    });

    it('add expediente error autodiagnostico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addExpediente(medicoAddress, 2345).send({from: medicoAddress, gas: '9000000'})}),
                "Un medico no se puede tratar a el mismo"
        );
    });

    /******************************** GET EXPEDIENTE **************************************/

    it('get expediente', async () => {
        const expediente = await sistemaClinico.methods.getExpediente(pacienteAddress).call({from: medicoAddress});
        assert.strictEqual(expediente.medicoAsignado, medicoAddress);
        assert.strictEqual(expediente.fechaNacimiento, '2345');
        assert.strictEqual(expediente.fechaMuerte, '0');
        assert.strictEqual(expediente.estado, '0');
        assert.strictEqual(expediente.tratamientosAbiertos.length, 1);
    });

    /******************************** GET EXPEDIENTE ERRORS **************************************/

    it('get expediente error onlyMedico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.getExpediente(pacienteAddress).send({from: ownerAddress, gas: '9000000'})}),
                "Solo un medico del sistema puede consultar los expedientes abiertos"
        );
    });

    it('get expediente error onlyPaciente', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.getExpediente(administrativoAddress).send({from: medicoAddress, gas: '9000000'})}),
                "Solo se pueden consultar expedientes de pacientes que pertenezcan al sistema"
        );
    });

    it('get expediente error onlyMedicoAsignado', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.getExpediente(pacienteAddress).send({from: otherMedicoAddress, gas: '9000000'})}),
                "Solo el medico asignado puede consultar un expediente abierto"
        );
    });

    /******************************** EXPEDIENTE DESPARECIDO **************************************/

    it('set expediente desaparecido', async () => {
        await sistemaClinico.methods.setExpedienteAsDesaparecido(pacienteAddress).send({from: administrativoAddress, gas: '9000000'});
        //Comprobamos que la modificacion se haya realizado correctamente
        const expediente = await sistemaClinico.methods.getExpediente(pacienteAddress).call({from: medicoAddress});
        assert.strictEqual(expediente.medicoAsignado, medicoAddress);
        assert.strictEqual(expediente.fechaNacimiento, '2345');
        assert.strictEqual(expediente.fechaMuerte, '0');
        assert.strictEqual(expediente.estado, '2');
        assert.strictEqual(expediente.tratamientosAbiertos.length, 1);
    });

    /******************************** EXPEDIENTE DESPARECIDO ERRORS **************************************/

    it('set expediente desaparecido onlySistema', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.setExpedienteAsDesaparecido(pacienteAddress).send({from: ownerAddress, gas: '9000000'})}),
                "Solo el sistema puede marcar un expediente como desaparecido"
        );
    });

    it('add tratamiento expediente desaparecido', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addTratamientoToExpediente(pacienteAddress, "dolor de cabeza", "aspirina y mucho agua").send({from: medicoAddress, gas: '9000000'})}),
                "No se pueden aniadir tratamientos a expedientes desaparecidos"
        );
    });

    it('update tratamiento expediente desaparecido', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.updateTratamientoToExpediente(pacienteAddress, tratamientoId, "aspirina y mucho agua").send({from: medicoAddress, gas: '9000000'})}),
                "No se pueden modificar tratamientos a expedientes desaparecidos"
        );
    });

    it('close tratamiento expediente desaparecido', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.closeTratamientoToExpediente(pacienteAddress, tratamientoId).send({from: medicoAddress, gas: '9000000'})}),
                "No se pueden cerrar tratamientos a expedientes desaparecidos"
        );
    });

    /******************************** CIERRA EXPEDIENTE **************************************/

    it('close expediente', async () => {
        const result = await sistemaClinico.methods.closeExpediente(pacienteAddress).send({from: medicoAddress, gas: '9000000'});
        //Comprobamos el evento
        var evento = result.events.BajaExpediente;
        assert.strictEqual(evento.returnValues._medico, medicoAddress);
        assert.strictEqual(evento.returnValues._paciente, pacienteAddress);
        //Comprobamos que el expediente sigue registrado en el sistema
        assert.ok(await sistemaClinico.methods.isPaciente(pacienteAddress).call({from: medicoAddress}));
        //Comprobamos a que le medico ya no tiene el paciente asignado en el sistema
        const pacientes = await sistemaClinico.methods.getPacientesFromMedico(medicoAddress).call({from: medicoAddress});
        for(var i = 0; i < pacientes.length; i++) {
            assert.notStrictEqual(pacientes[i], pacienteAddress);
        }
        //Comprobamos el estado del expediente
        const expediente = await sistemaClinico.methods.getExpediente(pacienteAddress).call({from: ownerAddress});
        //El medico asignado en el expediente tiene que ser el medico que lo cerro
        assert.strictEqual(expediente.medicoAsignado, medicoAddress);
        //Comprobamos que se le ha puesto fecha de la muerte
        assert.notStrictEqual(expediente.fechaMuerte, '0');
        //Comprobamos que el estado es muerto
        assert.strictEqual(expediente.estado, '1');
        //Comprobamos que no hay tratamientos abiertos
        assert.strictEqual(expediente.tratamientosAbiertos.length, 0);
    });

    /******************************** CIERRA EXPEDIENTE ERRORS **************************************/

    it('close expediente error onlyMedico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.closeExpediente(pacienteAddress).send({from: ownerAddress, gas: '9000000'})}),
                "Solo un medico del sistema puede interactuar los expedientes"
        );
    });

    it('close expediente error onlyPaciente', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.closeExpediente(administrativoAddress).send({from: medicoAddress, gas: '9000000'})}),
                "Solo se pueden cerrar expedientes de pacientes que pertenezcan al sistema"
        );
    });

    it('close expediente error onlyMedicoAsignado', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.closeExpediente(pacienteAddress).send({from: otherMedicoAddress, gas: '9000000'})}),
                "Solo el medico asignado puede interactuar con el expediente"
        );
    });

    it('close expediente error isAlive', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.closeExpediente(pacienteAddress).send({from: medicoAddress, gas: '9000000'})}),
                "Solo se pueden cerrar expedientes abiertos"
        );
    });

    /******************************** GET EXPEDIENTE CERRADO ERRORS **************************************/

    it('get expediente cerrado error onlySistema', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.getExpediente(pacienteAddress).send({from: medicoAddress, gas: '9000000'})}),
                "Solo el sistema puede consultar los expedientes cerrados"
        );
    });

    it('add tratamiento expediente cerrado', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addTratamientoToExpediente(pacienteAddress, "dolor de cabeza", "aspirina y mucho agua").send({from: medicoAddress, gas: '9000000'})}),
                "No se pueden aniadir tratamientos a expedientes cerrados"
        );
    });

    it('set estado expediente cerrado', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.setExpedienteAsAparecido(pacienteAddress).send({from: ownerAddress, gas: '9000000'})}),
                "No se puede modificar el estado de un expediente cerrado"
        );
    });

    it('set estado expediente cerrado', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.setExpedienteAsDesaparecido(pacienteAddress).send({from: ownerAddress, gas: '9000000'})}),
                "No se puede modificar el estado de un expediente cerrado"
        );
    });
});