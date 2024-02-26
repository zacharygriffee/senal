import {tadaSymbol, instigatorSymbol, reactiveSymbol} from "./symbols.js";

const reserved = [
    "initial",
    "collection",
    "property",
    "manual",
    "complete",
    "error"
];

function _inciter(any, reason, meta = {}) {
    if (typeof reason !== "string") {
        throw new Error("reason must be a string");
    }
    if (typeof meta !== "object" || Array.isArray(meta)) meta = {
        value: meta
    }
    let base = {
        ...meta,
        cause: any,
        reason: reason
    }

    if (any?.[reactiveSymbol]) {
        base = {
            ...base,
            isObserve: true,
            method: "observe"
        }
    } else if (any?.[tadaSymbol]) {
        base = {
            ...base,
            isCompute: true,
            method: "compute"
        }
    } else {
        base = {
            ...base,
            method: "unknown"
        }
    }

    Object.defineProperty(base, instigatorSymbol, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: true
    });

    return base
}

/**
 * Wrap anything to become an immutable instigator that can be passed to tada
 *
 * Reserved reasons: initial, collection, property, manual
 *
 * @example
 * // Make the robot
 * const deepThought = {answer: 42};
 * // Make the robot incitable and give it a 'reason' of 'robots'
 * const deepThoughtInciter = inciter(deepThought, "robots");
 * // Overwrite all other reasons by adding 'robots' reason to the end.
 * const $$$ = tada((inciter) => { inciter.cause.answer === 42; }, "robots");
 * // or add a reason to the reasons that already exist.
 * const $$$ = tada((inciter) => { inciter.cause.answer === 42; });
 * $$$.addFilter("robots");
 * // And then the incitable can incite a tada with context.
 * $$$.next(deepThoughtInstigator);
 * // Sure you could just do this
 * $$$.next(deepThought);
 * // but 'deepThought' will be internally added as a 'manual' inciter with no additional context.
 *
 * @param {*} any Any value. If passing an inciter, will return that inciter as is.
 * @param {string} reason A string representing the reason of this inciter.
 * @param {*} [meta={}] Additional meta context for the inciter. If a non-object is supplied, the inciter will
 * obtain a 'value' property i.e. meta = {value: meta};
 * @property {*} cause the 'any' argument
 * @property {string} reason the `reason` argument
 * @memberOf Señal
 */
function inciter(any, reason, meta = {}) {
    if (reserved.includes(reason)) {
        throw new Error(`Cannot use reserved reason "${reason}".`)
    }
    return Object.freeze(_inciter(any, reason, meta));
}

export {inciter, _inciter}