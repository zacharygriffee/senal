import {senals} from "./senals.js";

/**
 * Like senals but nested objects, including added nested objects, do not become reactive.
 * @see Señal.senals for configuration options (you cannot specify config.deep in this config)
 * @memberOf Señal
 */
function senal(object = {}, config = {}) {
    return senals(object, {...config, deep: false});
}

export {senal};