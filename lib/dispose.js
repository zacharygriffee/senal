import {tadaSymbol} from "./symbols.js";
import {currentTada} from "./act.js";

/**
 * Dispose a tada observer. A disposed tada cannot be used again.
 * @param {(function|object)} observer A function or tada that is being used in tada
 * @example
 * import {dispose, tada} from "senal";
 *
 * const disposable = tada(() => {
 *     // do tada things;
 * });
 *
 * dispose(disposable);
 * @returns {function} `observer` argument is returned except in the case of error.
 * @memberOf Señal
 */
function dispose(observer) {
    let isElse = false;
    let o = observer || currentTada;
    if (o?.[tadaSymbol]) {
        if (o[tadaSymbol].disposed) return observer;
        o[tadaSymbol].complete();
    } else {
        isElse = true;
    }
    if (typeof o !== "function" && typeof o !== "object") {
        throw new Error("Computed must be an observer or function.");
    }
    if (isElse) {
        // Just so don't have to make an entire observer for this.
        observer[tadaSymbol] = { disposed: true };
    }
     return observer;
}

export {dispose};