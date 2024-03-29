pragma solidity ^0.4.25;


contract CapaExpedientesInterface {

    /****************************************************************************************/
    /*********************************** EXPEDIENTES ****************************************/
    /****************************************************************************************/

    /**
    * @notice Crea un nuevo expediente para un paciente dado
    * @dev Solo un medico deberia poder crear nuevos expedientes
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    * @param _oriCaller La direccion del invocador original
    */
    function addExpediente(address _paciente, address _oriCaller) public;

    /**
    * @notice Crea un nuevo expediente para un paciente dado
    * @dev Solo un medico deberia poder crear nuevos expedientes
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    * @param _fechaNacimiento La fecha de nacimiento del paciente
    * @param _oriCaller La direccion del invocador original
    */
    function addExpediente(address _paciente, uint _fechaNacimiento, address _oriCaller) public;

    /**
    * @notice Cambia el estado del expediente a desaparecido
    * @dev Solo el sistema debe poder marcar un expediente como desaparecido
    * @param _paciente La direccion del paciente cuyo expediente se quiere modificar
    * @param _oriCaller La direccion del invocador original
    */
    function setExpedienteAsDesaparecido(address _paciente, address _oriCaller) public;

    /**
    * @notice Cambia el estado del expediente desmarcandolo como desaparecido
    * @dev Solo el sistema debe poder marcar un expediente como aparecido
    * @param _paciente La direccion del paciente cuyo expediente se quiere modificar
    * @param _oriCaller La direccion del invocador original
    */
    function setExpedienteAsAparecido(address _paciente, address _oriCaller) public;

    /**
    * @notice Transfiere todos los expedientes de un medico a otro
    * @dev Antes de llamar a este metodo hay que comprobar que ambos son medicos
    * @param _medicoFrom Medico del cual se van a transferir los expedientes
    * @param _medicoTo Medico al que se van a transferir los expedientes
    * @param _oriCaller La direccion del invocador original
    */
    function transfiereExpedientes(address _medicoFrom, address _medicoTo, address _oriCaller) public;

    /**
    * @notice Transfiere un expediente de un medico a otro
    * @param _paciente La direccion del paciente cuyo expediente queremos trasladar
    * @param _medicoTo La direccion del medico al que se va a transferir el expediente
    * @param _oriCaller La direccion del invocador original
    */
    function transfiereExpediente(address _paciente, address _medicoTo, address _oriCaller) public;

    /**
    * @notice Cierra un expediente existente
    * @dev Al cerrar el expediente se desasigna al medico pero no el medico asignado del expediente
    * @param _paciente La direccion del paciente al que se quiere aniadir el expediente
    * @param _oriCaller La direccion del invocador original
    */
    function closeExpediente(address _paciente, address _oriCaller) public;

    /**
    * @notice Lanza el evento de consulta de expediente
    * @dev Esto deberia lanzarse automaticamente al consultar el expediente
    * @param _paciente La direccion del paciente del que se quiere recuperar el expediente
    * @param _oriCaller La direccion del invocador original
    */
    function registraConsultaExpediente(address _paciente, address _oriCaller) public;

    /**
    * @notice Retorna la informacion de un expediente
    * @param _paciente La direccion del paciente del que se quiere recuperar el expediente
    * @param _oriCaller La direccion del invocador original
    * @return La informacion del expediente
    */
    function getExpediente(address _paciente, address _oriCaller) public view
        returns (
            address titular,
            address medicoAsignado,
            uint fechaNacimiento,
            uint fechaMuerte,
            uint estado,
            uint[] tratamientosAbiertos
        );

    /**
    * @notice Comprueba si una persona es paciente
    * @param _supuestoPaciente La direccion del paciente que hay que comprobar
    * @param _oriCaller La direccion del invocador original
    * @return Booleano que indica si es paciente o no
    */
    function isPaciente(address _supuestoPaciente, address _oriCaller) public view returns (bool);

    /**
    * @notice Obtiene todos los pacientes de un medico
    * @param _medico La direccion del medico del que queremos recuperar los pacientes
    * @param _oriCaller La direccion del invocador original
    * @return Lista de direcciones de sus pacientes
    */
    function getPacientesFromMedico(address _medico, address _oriCaller) public view returns (address[]);

    /****************************************************************************************/
    /*********************************** TRATAMIENTOS ***************************************/
    /****************************************************************************************/

    /**
    * @notice Aniade un nuevo tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere aniadir el tratamiento
    * @param _dolencia Dolencia de la que se queja el paciente
    * @param _descripcion Descripcion del tratamiento a seguir
    * @param _oriCaller La direccion del invocador original
    * @return El identificador del nuevo tratamiento
    */
    function addTratamientoToExpediente(address _paciente, string _dolencia, string _descripcion, address _oriCaller) public returns(uint);

    /**
    * @notice Modifica un tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere aniadir el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    * @param _descripcion Descripcion del tratamiento a seguir
    * @param _oriCaller La direccion del invocador original
    */
    function updateTratamientoToExpediente(address _paciente, uint _idxTratamiento, string _descripcion, address _oriCaller) public;

    /**
    * @notice Modifica un tratamiento a un expediente existente
    * @param _paciente La direccion del paciente al que se quiere cerrar el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    * @param _oriCaller La direccion del invocador original
    */
    function closeTratamientoToExpediente(address _paciente, uint _idxTratamiento, address _oriCaller) public;

    /**
    * @notice Lanza el evento de consulta de tratamiento
    * @dev Esto deberia lanzarse automaticamente al consultar el tratamiento
    * @param _paciente La direccion del paciente
    * @param _idxTratamiento El identificador del tratamiendo que queremos recuperar
    * @param _oriCaller La direccion del invocador original
    */
    function registraConsultaTratamiento(address _paciente, uint _idxTratamiento, address _oriCaller) public;

    /**
    * @notice Obtiene el tratamiento de un expediente
    * @param _paciente La direccion del paciente del que se quiere recuperar el tratamiento
    * @param _idxTratamiento El identificador del tratamiento
    * @param _oriCaller La direccion del invocador original
    */
    function getTratamientoFromExpediente(address _paciente, uint _idxTratamiento, address _oriCaller) public view
        returns (
            uint fechaInicio,
            uint fechaFin,
            string dolencia,
            string descripcion
        );
}
