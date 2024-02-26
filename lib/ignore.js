import {ignoredSymbol} from "./symbols.js";

/**
 * When an ignored object is encountered, it will not be made reactive when passed to `senals`
 * @param {object} object Ignore this object in becoming reactive in `senals`.
 * @memberOf Señal
 * @returns {object} The object is returned.
 */
function ignore(object) {
    if (typeof object !== "object" || Array.isArray(object)) throw new Error("Cannot ignore passed argument");
    object[ignoredSymbol] = true;
    return object;
}

export {ignore};