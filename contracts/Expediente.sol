pragma solidity ^0.4.25;

import "./utils/Arrays.sol";

//todo: Hacerlo Ownable para la migracion?

contract Expediente {

    using Arrays for uint[];

    event AltaTratamiento(address _titular, address _medico, uint _idxTratamiento);
    event ModificacionTratamiento(address _titular, address _medico, uint _idxTratamiento);
    event BajaTratamiento(address _titular, address _medico, uint _idxTratamiento);
    event ConsultaTratamiento(address _paciente, address _medico, uint _idxTratamiento);

    enum Estado {
        Vivo,
        Muerto,
        Desaparecido,
        Catalepsia
    }

    struct Tratamiento {
        uint fechaInicio;
        uint fechaFin;
        string dolencia;
        string descripcion;
    }

    Estado private estado;
    address private titular;
    address private sistemaClinico;
    address private medicoAsignado;
    uint private fechaNacimiento;
    uint private fechaMuerte;
    Tratamiento[] private tratamientos;
    uint[] private tratamientosAbiertos;

    /**
    * @notice Crea un nuevo expediente
    * @param _titular La direccion del paciente
    * @param _medico La direccion del medico asignado
    * @param _fechaNacimiento La fecha de nacimiento del paciente
    */
    constructor(address _titular, address _medico, uint _fechaNacimiento) public autodiagnosis(_titular, _medico) {
        sistemaClinico = msg.sender;
        estado = Estado.Vivo;
        titular = _titular;
        medicoAsignado = _medico;
        fechaNacimiento = _fechaNacimiento;
    }

    /**
    * @notice Comprueba que la persona a la que pertenece el expediente este viva
    */
    modifier isAlive() {
        require(estado == Estado.Vivo, "El paciente no esta vivo");
        _;
    }

    /**
    * @notice Comprueba que la persona a la que pertenece el expediente este desaparecida
    */
    modifier isDesaparecido() {
        require(estado == Estado.Desaparecido, "El paciente no esta desaparecido");
        _;
    }

    /**
    * @notice Comprueba que la persona a la que pertenece el expediente no este muerta
    */
    modifier isNotDead() {
        require(estado != Estado.Muerto, "El paciente esta muerto");
        _;
    }

    /**
    * @notice Comprueba que el invocador es el sistema clinico al que pertenezco
    */
    modifier onlySistema() {
        require(sistemaClinico == msg.sender, "Solo el sistema propietario del expediente puede ejecutar este metodo");
        _;
    }

    /**
    * @notice Comprueba que el tratamiento este abierto
    * @param _idxTratamiento El identificador del tratamiento a comprobar
    */
    modifier onlyTratamientoAbierto(uint _idxTratamiento) {
        require(tratamientos[_idxTratamiento].fechaFin == 0, "El tratamiento esta cerrado");
        _;
    }

    /**
    * @notice Comprueba que el medico no sea el paciente (evitar autodiagnosis)
    * @param _titular La direccion del titular
    * @param _medico La direccion del medico
    */
    modifier autodiagnosis(address _titular, address _medico) {
        require(_titular != _medico, "Un medico no puede autodiagnosticarse");
        _;
    }

    /****************************************************************************************/
    /************************************ EXPEDIENTE ****************************************/
    /****************************************************************************************/

    /**
    * @notice Cambia el medico asignado de un expediente
    * @param _newMedico La direccion del nuevo medico
    */
    function cambiaMedico(address _newMedico) public onlySistema isNotDead autodiagnosis(titular, _newMedico) {
        medicoAsignado = _newMedico;
    }

    /**
    * @notice Cambia el estado del expediente
    * @dev No se puede cambiar el estado a muerto desde este metodo, usar close()
    * @param _estado El estado
    */
    function cambiaEstado(Estado _estado) public onlySistema isNotDead {
        require(_estado != Estado.Muerto, "Para cambiar el estado a muerto usar el metodo close()");
        estado = _estado;
    }

    /**
    * @notice Cierra el expediente de un paciente marcondolo como fallecido
    * @dev No desasignamos el medico dentro del expediente para saber quien fue quien diagnostico la muerte
    * @param _medico El medico que ha ordenado el cierre del expediente
    */
    function close(address _medico) public onlySistema isNotDead {
        //Primero cerramos todos los tratamientos abiertos
        for(uint i = 0;i < tratamientosAbiertos.length; i++)
        {
            tratamientos[tratamientosAbiertos[i]].fechaFin = now;
            emit BajaTratamiento(titular, _medico, tratamientosAbiertos[i]);
        }
        tratamientosAbiertos.length = 0;
        estado = Estado.Muerto;
        fechaMuerte = now;
    }

    /****************************************************************************************/
    /********************************** TRATAMIENTOS ****************************************/
    /****************************************************************************************/

    /**
    * @notice Aniade un nuevo tratamiento al expediente
    * @param _dolencia Dolencia de la que se queja el paciente
    * @param _descripcion Descripcion del tratamiento a seguir
    * @return El identificador del tratamiendo creado
    */
    function addTratamiento(string _dolencia, string _descripcion, address _medico) public onlySistema isAlive returns(uint) {
        tratamientos.push(Tratamiento(now, 0, _dolencia, _descripcion));
        uint idx = tratamientos.length -1;
        tratamientosAbiertos.push(idx);
        emit AltaTratamiento(titular, _medico, idx);
        return idx;
    }

    /**
    * @notice Modifica un tratamiento abierto
    * @param _idxTratamiento El identificador del tratamiento
    * @param _descripcion La descripcion a modificar
    */
    function updateTratamiento(uint _idxTratamiento, string _descripcion, address _medico) public onlySistema isAlive onlyTratamientoAbierto(_idxTratamiento) {
        tratamientos[_idxTratamiento].descripcion = _descripcion;
        emit ModificacionTratamiento(titular, _medico, _idxTratamiento);
    }

    /**
    * @notice Da por finalizado el tratamiento
    * @param _idxTratamiento Identificador del tratamiento
    */
    function closeTratamiento(uint _idxTratamiento, address _medico) public onlySistema isAlive onlyTratamientoAbierto(_idxTratamiento) {
        tratamientos[_idxTratamiento].fechaFin = now;
        uint _idxTratAbierto;
        for(uint i = 0; i < tratamientosAbiertos.length; i++) {
            if(tratamientosAbiertos[i] == _idxTratamiento) {
                _idxTratAbierto = i;
                //Forzamos la condicion de salida del bucle
                i = tratamientosAbiertos.length;
            }
        }
        tratamientosAbiertos.deleteByIndex(_idxTratAbierto);
        emit BajaTratamiento(titular, _medico, _idxTratamiento);
    }

    /**
    * @notice Lanza el evento de consulta de tratamiento
    * @dev Esto deberia lanzarse automaticamente al consultar el tratamiento
    * @param _paciente La direccion del paciente
    * @param _medico La direccion del medico
    * @param _idxTratamiento El identificador del tratamiendo que queremos recuperar
    */
    function registraConsultaTratamiento(address _paciente, address _medico, uint _idxTratamiento) public onlySistema {
        emit ConsultaTratamiento(_paciente, _medico, _idxTratamiento);
    }
    
    /**
    * @notice Devuelve la informacion de un tratamiento
    * @param _idxTratamiento El identificador del tratamiendo que queremos recuperar
    * @return La informacion del tratamiento
    */
    function getTratamiento(uint _idxTratamiento) public view onlySistema
        returns (
            uint fechaInicio,
            uint fechaFin,
            string dolencia,
            string descripcion
        )
    {
        Tratamiento memory tratamiento = tratamientos[_idxTratamiento];
        return (tratamiento.fechaInicio, tratamiento.fechaFin, tratamiento.dolencia, tratamiento.descripcion);
    }

    /****************************************************************************************/
    /************************************ GETTERS *******************************************/
    /****************************************************************************************/

    /**
    * @notice Devuelve los identificadores de los tratamientos abiertos del expediente
    * @return La lista con los identificadores de los tratamientos abiertos
    */
    function getTratamientoAbiertosIds() public view onlySistema returns(uint[]) {
        return tratamientosAbiertos;
    }

    /**
    * @notice Devuelve el medico asignado del expediente
    * @return El medico asignado
    */
    function getMedicoAsignado() public view onlySistema returns (address) {
        return medicoAsignado;
    }

    /**
    * @notice Devuelve el estado del expediente
    * @return El estado
    */
    function getEstado() public view onlySistema returns (Estado) {
        return estado;
    }

    /**
    * @notice Devuelve la fecha de nacimiento del paciente del expediente
    * @return La fecha de nacimiento
    */
    function getFechaNacimiento() public view onlySistema returns (uint) {
        return fechaNacimiento;
    }

    /**
    * @notice Devuelve la fecha de defuncion del paciente del expediente
    * @return La fecha de defuncion
    */
    function getFechaMuerte() public view onlySistema returns (uint) {
        return fechaMuerte;
    }
}
