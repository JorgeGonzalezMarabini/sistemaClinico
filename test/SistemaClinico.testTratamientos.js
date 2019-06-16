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
let unknownAddress;
let administrativoAddress;
let otherMedicoAddress;

const DOLENCIA_TEXT = "dolor";
const TRATAMIENTO_PRELIMINAR_TEXT = "parazetamol y mucho agua";
const TRATAMIENTO_AVANZADO_TEXT = "parazetamol y mucho mas agua";

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
    unknownAddress = accounts[3];
    otherMedicoAddress = accounts[4];
    administrativoAddress = accounts[5];

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

describe('SistemaClinico-Tratamientos', () => {

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
        //Aniadimos al medico
        await sistemaClinico.methods.addMedico(medicoAddress).send({from: administrativoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isMedico(medicoAddress).call({from: administrativoAddress}));
        //Aniadimos el expediente
        await sistemaClinico.methods.addExpediente(pacienteAddress, 2345).send({from: medicoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isPaciente(pacienteAddress).call({from: medicoAddress}));
    });

    let tratamientoId;

    /******************************** ADD TRATAMIENTO **************************************/

    it('add tratamiento', async () => {
        //Obtenemos el expediente para consultar los tratamientos abiertos
        var expediente = await sistemaClinico.methods.getExpediente(pacienteAddress).call({from: medicoAddress});
        assert.strictEqual(expediente.tratamientosAbiertos.length, 0);
        //Aniadimos el tratamiento
        const result = await sistemaClinico.methods.addTratamientoToExpediente(pacienteAddress, DOLENCIA_TEXT, TRATAMIENTO_PRELIMINAR_TEXT).send({from: medicoAddress, gas: '9000000'});
        //Obtenemos el id del tratamiento del evento lanzado por el expediente
        const eventData = web3.eth.abi.decodeParameters(['address', 'address', 'uint256'], result.events['0'].raw.data);
        tratamientoId = eventData['2'];
        assert.strictEqual(eventData['0'], pacienteAddress);
        //Obtenemos el expediente para consultar los tratamientos abiertos
        expediente = await sistemaClinico.methods.getExpediente(pacienteAddress).call({from: medicoAddress});
        assert.strictEqual(expediente.tratamientosAbiertos.length, 1);
        assert.strictEqual(expediente.tratamientosAbiertos[0], tratamientoId);
    });

    /******************************** ADD TRATAMIENTO ERRORS **************************************/

    it('add tratamiento error onlyMedico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addTratamientoToExpediente(pacienteAddress, DOLENCIA_TEXT, TRATAMIENTO_PRELIMINAR_TEXT).send({from: unknownAddress, gas: '9000000'})}),
                "Solo un medico del sistema puede interactuar con los expedientes del sistema"
        );
    });

    it('add tratamiento error onlyPaciente', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addTratamientoToExpediente(unknownAddress, DOLENCIA_TEXT, TRATAMIENTO_PRELIMINAR_TEXT).send({from: medicoAddress, gas: '9000000'})}),
                "Solo se interactuar con expedientes del sistema"
        );
    });
    
    it('add tratamiento error onlyMedicoAsignado', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addTratamientoToExpediente(pacienteAddress, DOLENCIA_TEXT, TRATAMIENTO_PRELIMINAR_TEXT).send({from: otherMedicoAddress, gas: '9000000'})}),
                "Solo el medico asignado puede interactuar con el expediente"
        );
    });

    /******************************** GET TRATAMIENTO **************************************/

    it('get tratamiento', async () => {
        var {fechaFin, dolencia, descripcion} = await sistemaClinico.methods.getTratamientoFromExpediente(pacienteAddress, tratamientoId).call({from: medicoAddress, gas: '9000000'});
        assert.strictEqual(fechaFin, '0');
        assert.strictEqual(dolencia, DOLENCIA_TEXT);
        assert.strictEqual(descripcion, TRATAMIENTO_PRELIMINAR_TEXT);
    });

    /******************************** GET TRATAMIENTO ERRORS **************************************/

    it('get tratamiento error onlyMedico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.getTratamientoFromExpediente(pacienteAddress, tratamientoId).call({from: unknownAddress, gas: '9000000'})}),
                "Solo un medico del sistema puede interactuar con los expedientes del sistema"
        );
    });

    it('get tratamiento error onlyPaciente', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addTratamientoToExpediente(unknownAddress, DOLENCIA_TEXT, TRATAMIENTO_PRELIMINAR_TEXT).send({from: medicoAddress, gas: '9000000'})}),
                "Solo se pueden consultar los pacientes con expediente en el sistema"
        );
    });

    it('get tratamiento error onlyMedicoAsignado', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addTratamientoToExpediente(pacienteAddress, DOLENCIA_TEXT, TRATAMIENTO_PRELIMINAR_TEXT).send({from: otherMedicoAddress, gas: '9000000'})}),
                "Solo el medico asignado puede interactuar con el expediente"
        );
    });

    /******************************** UPDATE TRATAMIENTO **************************************/

    it('update tratamiento', async () => {
        const result = await sistemaClinico.methods.updateTratamientoToExpediente(pacienteAddress, tratamientoId, TRATAMIENTO_AVANZADO_TEXT).send({from: medicoAddress, gas: '9000000'});
        //Comprobamos los datos del evento
        const eventData = web3.eth.abi.decodeParameters(['address', 'address', 'uint256'], result.events['0'].raw.data);
        assert.strictEqual(eventData[0], pacienteAddress);
        assert.strictEqual(eventData[1], medicoAddress);
        assert.strictEqual(eventData[2], tratamientoId);
        //Comprobamos que el tratamiento haya cambiado
        var {fechaFin, dolencia, descripcion} = await sistemaClinico.methods.getTratamientoFromExpediente(pacienteAddress, tratamientoId).call({from: medicoAddress, gas: '9000000'});
        assert.strictEqual(fechaFin, '0');
        assert.strictEqual(dolencia, DOLENCIA_TEXT);
        assert.strictEqual(descripcion, TRATAMIENTO_AVANZADO_TEXT);
        //Obtenemos el expediente para consultar los tratamientos abiertos
        const expediente = await sistemaClinico.methods.getExpediente(pacienteAddress).call({from: medicoAddress});
        assert.strictEqual(expediente.tratamientosAbiertos.length, 1);
        assert.strictEqual(expediente.tratamientosAbiertos[0], tratamientoId);
    });

    /******************************** UPDATE TRATAMIENTO ERRORS **************************************/

    it('update tratamiento error onlyMedico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.getTratamientoFromExpediente(pacienteAddress, tratamientoId).send({from: unknownAddress, gas: '9000000'})}),
                "Solo un medico del sistema puede interactuar con los expedientes del sistema"
        );
    });

    it('update tratamiento error onlyPaciente', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.getTratamientoFromExpediente(unknownAddress, tratamientoId).send({from: medicoAddress, gas: '9000000'})}),
                "Solo se interactuar con expedientes del sistema"
        );
    });
    
    it('update tratamiento error onlyMedicoAsignado', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.getTratamientoFromExpediente(pacienteAddress, tratamientoId).send({from: otherMedicoAddress, gas: '9000000'})}),
                "Solo el medico asignado puede interactuar con el expediente"
        );
    });

    /******************************** CLOSE TRATAMIENTO **************************************/

    it('close tratamiento', async () => {
        const result = await sistemaClinico.methods.closeTratamientoToExpediente(pacienteAddress, tratamientoId).send({from: medicoAddress, gas: '9000000'});
        //Comprobamos los datos del evento
        const eventData = web3.eth.abi.decodeParameters(['address', 'address', 'uint256'], result.events['0'].raw.data);
        assert.strictEqual(eventData[0], pacienteAddress);
        assert.strictEqual(eventData[1], medicoAddress);
        assert.strictEqual(eventData[2], tratamientoId);
        //Comprobamos que el tratamiento haya cambiado
        var {fechaFin, dolencia, descripcion} = await sistemaClinico.methods.getTratamientoFromExpediente(pacienteAddress, tratamientoId).call({from: medicoAddress, gas: '9000000'});
        assert.notStrictEqual(fechaFin, '0');
        assert.strictEqual(dolencia, DOLENCIA_TEXT);
        assert.strictEqual(descripcion, TRATAMIENTO_AVANZADO_TEXT);
        //Obtenemos el expediente para consultar los tratamientos abiertos
        const expediente = await sistemaClinico.methods.getExpediente(pacienteAddress).call({from: medicoAddress});
        assert.strictEqual(expediente.tratamientosAbiertos.length, 0);
    });

    /******************************** CLOSE TRATAMIENTO ERRORS **************************************/

    it('close tratamiento error onlyMedico', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.closeTratamientoToExpediente(pacienteAddress, tratamientoId).send({from: unknownAddress, gas: '9000000'})}),
                "Solo un medico del sistema puede interactuar con los expedientes del sistema"
        );
    });

    it('close tratamiento error onlyPaciente', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.closeTratamientoToExpediente(unknownAddress, tratamientoId).send({from: medicoAddress, gas: '9000000'})}),
                "Solo se interactuar con expedientes del sistema"
        );
    });
    
    it('close tratamiento error onlyMedicoAsignado', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.closeTratamientoToExpediente(pacienteAddress, tratamientoId).send({from: otherMedicoAddress, gas: '9000000'})}),
                "Solo el medico asignado puede interactuar con el expediente"
        );
    });

    it('close tratamiento error onlyTratamientoAbierto', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.closeTratamientoToExpediente(pacienteAddress, tratamientoId).send({from: medicoAddress, gas: '9000000'})}),
                "Solo se puede cerrar un tratamiento abierto"
        );
    });


});