pragma solidity ^0.4.25;

import "./CapaExpedientes.sol";

contract CapaTratamientos is CapaExpedientes {
    
    /**
    * @notice Aniade un nuevo tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere aniadir el tratamiento
    * @param _dolencia Dolencia de la que se queja el paciente
    * @param _descripcion Descripcion del tratamiento a seguir
    * @return El identificador del nuevo tratamiento
    */
    function addTratamientoToExpediente(address _paciente, string _dolencia, string _descripcion) public onlyMedico onlyPaciente(_paciente) onlyMedicoAsignado(_paciente) returns(uint) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        return expediente.addTratamiento(_dolencia, _descripcion);
    }

    /**
    * @notice Modifica un tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere aniadir el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    * @param _descripcion Descripcion del tratamiento a seguir
    */
    function updateTratamientoToExpediente(address _paciente, uint _idxTratamiento, string _descripcion) public onlyMedico onlyPaciente(_paciente) onlyMedicoAsignado(_paciente) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        expediente.updateTratamiento(_idxTratamiento, _descripcion);
    }

    /**
    * @notice Modifica un tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere cerrar el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    */
    function closeTratamientoToExpediente(address _paciente, uint _idxTratamiento) public onlyMedico onlyPaciente(_paciente) onlyMedicoAsignado(_paciente) {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        expediente.closeTratamiento(_idxTratamiento);
    }

    /**
    * @notice Obtiene el tratamiento de un expediente
    * @param _paciente La direccion del paciente del que se quiere recuperar el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    */
    function getTratamientoFromExpediente(address _paciente, uint _idxTratamiento) public view onlyMedico onlyPaciente(_paciente) onlyMedicoAsignado(_paciente)
        returns (
            uint fechaInicio,
            uint fechaFin,
            string dolencia,
            string descripcion
        )
    {
        Expediente expediente = Expediente(datos.getExpedienteAddress(_paciente));
        return expediente.getTratamiento(_idxTratamiento);
    }
}
