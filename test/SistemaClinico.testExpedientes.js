const assert = require('assert');
const ganache = require("ganache-cli");

const Web3 = require('web3');
const web3 = new Web3();
web3.setProvider(ganache.provider({gasLimit: 1000000000}));

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

describe('SistemaClinico-Expedientes', () => {

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
        await sistemaClinico.methods.addMedico(otherMedicoAddress).send({from: administrativoAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isMedico(otherMedicoAddress).call({from: administrativoAddress}));
    });

    /******************************** ADD EXPEDIENTE **************************************/

    let tratamientoId;


    it('add expediente', async () => {
        const result = await sistemaClinico.methods.addExpediente(pacienteAddress, 2345).send({from: medicoAddress, gas: '9000000'});
        const resultTratamiento = await sistemaClinico.methods.addTratamientoToExpediente(pacienteAddress, "dolencia", "tratamiento").send({from: medicoAddress, gas: '9000000'});
        //Comprobamos el evento del alta del expediente
        const eventoExp = web3.eth.abi.decodeParameters(['address', 'address'], result.events['0'].raw.data);
        assert.strictEqual(eventoExp['0'], medicoAddress);
        assert.strictEqual(eventoExp['1'], pacienteAddress);
        //Comprobamos el evento del alta del tratamiento
        const eventoTrat = web3.eth.abi.decodeParameters(['address', 'address', 'uint256'], resultTratamiento.events['0'].raw.data);
        assert.strictEqual(eventoTrat['0'], pacienteAddress);
        assert.strictEqual(eventoTrat['1'], medicoAddress);
        tratamientoId = eventoTrat['2'];
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
        
        const result = await sistemaClinico.methods.registraConsultaExpediente(pacienteAddress).send({from: medicoAddress, gas: '9000000'});
        //Comprobamos el evento de consulta de expediente
        const evento = web3.eth.abi.decodeParameters(['address', 'address'], result.events['0'].raw.data);
        assert.strictEqual(evento['0'], medicoAddress);
        assert.strictEqual(evento['1'], pacienteAddress);
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
        //Comprobamos el evento de cierre de expediente
        const eventoExp = web3.eth.abi.decodeParameters(['address', 'address'], result.events['1'].raw.data);
        assert.strictEqual(eventoExp['0'], medicoAddress);
        assert.strictEqual(eventoExp['1'], pacienteAddress);
        //Comprobamos el evento de cierre del tratamiento
        const eventoTrat = web3.eth.abi.decodeParameters(['address', 'address', 'uint'], result.events['0'].raw.data);
        assert.strictEqual(eventoTrat['0'], pacienteAddress);
        assert.strictEqual(eventoTrat['1'], medicoAddress);
        assert.strictEqual(eventoTrat['2'], tratamientoId);
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