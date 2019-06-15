pragma solidity ^0.4.25;

library Arrays {

    /**
     * @notice Borra el elemento de un array de uint basandose en el indice pasado
     * @param _array El array sobre el que borrar
     * @param _idx El indice del array a borrar
     */
    function deleteByIndex(uint[] storage _array, uint _idx) internal {
        uint size = _array.length;
        if(size > 0) {
            //Tengo que asegurarme de que existe la posicion a borrar
            if(size > _idx) {
                //En caso de solo haber un elemento lo borro
                if(size == 1) {
                    _array.length = 0;
                } else {
                    //En caso de no ser el ultimo, muevo este al indice a borrar
                    if(size > (_idx + 1)) {
                        _array[_idx] = _array[size - 1];
                    }
                    //Siempre acorto el array por el final
                    _array.length = size - 1;
                }
            }
        }
    }

    /**
     * @notice Borra un elemento de un array de address
     * @param _array El array sobre el que borrar
     * @param _addressToDelete La direccion a borrar
     */
    function deleteByAddress(address[] storage _array, address _addressToDelete) internal {
        uint size = _array.length;
        if(size > 0) {
            //Primero localizo la posicion de la direccion a borrar
            uint _idx = size;
            for(uint i = 0; i < size; i++) {
                if(_addressToDelete == _array[i]) {
                    _idx = i;
                    //Forzamos la condicion de salida
                    i = size;
                }
            }
            //Tengo que asegurarme de que existe la posicion a borrar
            if(size > _idx) {
                //En caso de solo haber un elemento lo borro
                if(size == 1) {
                    _array.length = 0;
                } else {
                    //En caso de no ser el ultimo, muevo este al indice a borrar
                    if(size > (_idx + 1)) {
                        _array[_idx] = _array[size - 1];
                    }
                    //Siempre acorto el array por el final
                    _array.length = size - 1;
                }
            }
        }
    }
}
