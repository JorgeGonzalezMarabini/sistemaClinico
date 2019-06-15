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
let administrativoAddress;
let unknownAddress;
let otherAdministrativoAddress;

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
    administrativoAddress = accounts[1];
    unknownAddress = accounts[2];
    otherAdministrativoAddress = accounts[3];

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

describe('SistemaClinico-Administrativos', () => {

    it('desplegar los contratos', async () => {
        //Asignamos al sistema el contrato de los datos
        await sistemaClinico.methods.setDatosAddress(datosSistemaAddress).send({from: ownerAddress, gas: '9000000'});
        assert.ok(sistemaAddress);
        assert.ok(datosSistemaAddress);
    });

    /******************************** ADD ADMINISTRATIVO **************************************/

    it('add administrativo', async () => {
        //Comprobamos que en el sistema se ha almacenado correctamente
        await sistemaClinico.methods.addAdministrativo(administrativoAddress).send({from: ownerAddress, gas: '9000000'});
        assert.ok(await sistemaClinico.methods.isAdministrativo(administrativoAddress).call({from: ownerAddress}));
        //Comprobamos que en los datos se ha almacenado correctamente
        const administrativos = await datosSistemaClinico.methods.getAdministrativosList().call({from: ownerAddress});
        assert.strictEqual(administrativos.length, 1);
        assert.strictEqual(administrativos[0], administrativoAddress);
    });

    /******************************** ADD ADMINISTRATIVO ERRORS **************************************/

    it('add administrativo error onlyOwner', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addAdministrativo(unknownAddress).send({from: administrativoAddress, gas: '9000000'})}),
                "Solo el propietario puede dar de alta nuevos administrativos"
        );
    });

    it('add administrativo error onlyNotSistemaAdministrativos', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.addAdministrativo(administrativoAddress).send({from: ownerAddress, gas: '9000000'})}),
                "No se pueden dar de alta administrativos que ya existan en el sistema"
        );
    });

    /******************************** REMOVE ADMINISTRATIVO **************************************/

    it('remove administrativo', async () => {
        //Comprobamos que en el sistema se ha borrado correctamente
        await sistemaClinico.methods.removeAdministrativo(administrativoAddress).send({from: ownerAddress, gas: '9000000'});
        assert.ok(!await sistemaClinico.methods.isAdministrativo(administrativoAddress).call({from: ownerAddress}));
        //Comprobamos que en los datos se ha borrado correctamente
        const administrativos = await datosSistemaClinico.methods.getAdministrativosList().call({from: ownerAddress});
        assert.strictEqual(administrativos.length, 0);
    });

    /******************************** REMOVE ADMINISTRATIVO ERRORS **************************************/

    it('remove administrativo error onlyOwner', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.removeAdministrativo(administrativoAddress).send({from: unknownAddress, gas: '9000000'})}),
                "Solo el propietario puede dar de baja administrativos"
        );
    });

    it('remove administrativo error onlyOverAdministrativo', async () => {
        assert.ok(
                await assertException(async () => { await sistemaClinico.methods.removeAdministrativo(administrativoAddress).send({from: ownerAddress, gas: '9000000'})}),
                "Solo se pueden borrar administrativos del sistema"
        );
    });

});