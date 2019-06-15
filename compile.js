const path = require("path");
const fs = require("fs-extra");
const solc = require("solc");

// Functions

/**
 * Makes sure that the build folder is deleted, before every compilation
 * @returns {*} - Path where the compiled sources should be saved.
 */
function compilingPreperations() {
    const buildPath = path.resolve(__dirname, 'build');
    fs.removeSync(buildPath);
    return buildPath;
}

/**
 * Returns and Object describing what to compile and what need to be returned.
 */
function createConfiguration() {
    return {
        language: 'Solidity',
        sources: {
            'DatosSistemaClinico.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts', 'DatosSistemaClinico.sol'), 'utf8')
            },
            'SistemaClinico.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts', 'SistemaClinico.sol'), 'utf8')
            },
            'SistemaClinicoProxy.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts', 'SistemaClinicoProxy.sol'), 'utf8')
            }
        },
        settings: {
            optimizer: {
                enabled: true
            },
            outputSelection: { // return everything
                '*': {
                    '*': ['*']
                }
            }
        }
    };
}

/**
 * Compiles the sources, defined in the config object with solc-js.
 * @param config - Configuration object.
 * @returns {any} - Object with compiled sources and errors object.
 */
function compileSources(config) {
    try {
        return JSON.parse(solc.compileStandardWrapper(JSON.stringify(config), getImports));
    } catch (e) {
        console.log(e);
    }
}

/**
 * Searches for dependencies in the Solidity files (import statements). All import Solidity files
 * need to be declared here.
 * @param dependency
 * @returns {*}
 */
function getImports(dependency) {
    console.log('Searching for dependency: ', dependency);
    switch (dependency) {
        case 'Expediente.sol':
            return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'Expediente.sol'), 'utf8')};
        case 'Owned.sol':
            return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'Owned.sol'), 'utf8')};
        case 'math/SafeMath.sol':
            return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'math', 'SafeMath.sol'), 'utf8')};
        case 'utils/Arrays.sol':
            return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'utils', 'Arrays.sol'), 'utf8')};
        case 'sistema/BaseSistemaClinico.sol':
            return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'sistema', 'BaseSistemaClinico.sol'), 'utf8')};
        case 'sistema/CapaAdministrativa.sol':
            return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'sistema', 'CapaAdministrativa.sol'), 'utf8')};
        case 'sistema/CapaMedicos.sol':
            return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'sistema', 'CapaMedicos.sol'), 'utf8')};
        case 'sistema/CapaExpedientes.sol':
            return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'sistema', 'CapaExpedientes.sol'), 'utf8')};
        case 'sistema/CapaTratamientos.sol':
            return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'sistema', 'CapaTratamientos.sol'), 'utf8')};
        default:
            return {error: 'File not found'}
    }
}

/**
 * Shows when there were errors during compilation.
 * @param compiledSources
 */
function errorHandling(compiledSources) {
    if (!compiledSources) {
        console.error('>>>>>>>>>>>>>>>>>>>>>>>> ERRORS <<<<<<<<<<<<<<<<<<<<<<<<\n', 'NO OUTPUT');
    } else if (compiledSources.errors) { // something went wrong.
        console.error('>>>>>>>>>>>>>>>>>>>>>>>> ERRORS <<<<<<<<<<<<<<<<<<<<<<<<\n');
        compiledSources.errors.map(error => console.log(error.formattedMessage));
    }
}

/**
 * Writes the contracts from the compiled sources into JSON files, which you will later be able to
 * use in combination with web3.
 * @param compiled - Object containing the compiled contracts.
 * @param buildPath - Path of the build folder.
 */
function writeOutput(compiled, buildPath) {
    fs.ensureDirSync(buildPath);

    for (let contractFileName in compiled.contracts) {
        const contractName = contractFileName.replace('.sol', '');
        if(compiled.contracts[contractFileName][contractName])
        {
            console.log('Writing: ', contractName + '.json');
            fs.outputJsonSync(
                path.resolve(buildPath, contractName + '.json'),
                compiled.contracts[contractFileName][contractName]
            );
        }
    }
}

// Workflow

const buildPath = compilingPreperations();
const config = createConfiguration();
const compiled = compileSources(config);
errorHandling(compiled);
writeOutput(compiled, buildPath);

const smartContracts = compiled.contracts;

module.exports = smartContracts;