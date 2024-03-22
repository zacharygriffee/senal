import {
    tadaSymbol,
    inciterSymbol,
    reactive,
    invokable,
    invoke as invokeSym,
    invoker as invokerSym
} from "./symbols.js";
import {getSpot} from "get-spot";
import {setCurrentWhile} from "./act.js";

const _defaultSymbolInciterMaker = (any, reason, meta, stackOffset = 4) => {
    let stack;
    let stackItem;
    if (reason === "error") {
        stackItem = getSpot(meta.error)
    } else {
        stack = getSpot();
        stackItem = stack[stackOffset];
    }
    // This check mainly occurs in browser.
    if (!stackItem && stack) {
        /* c8 ignore next 2 */
        stackItem = stack[stack.length - 1];
    }

    const {callee, line, column, file, beforeParse} = (stackItem || {});
    let symbol = Symbol.for(reason + "#" + beforeParse);

    Object.assign(
        meta,
        {
            callee,
            line,
            column,
            offset: stackOffset,
            file,
            stack
        }
    );

    return symbol;
}

let inciterSymbolMaker = _defaultSymbolInciterMaker;

/**
 * By default, the internal mechanism of making deterministic symbols for the inciters is to use the invocation point and the reason.
 * However, this maybe slow on large senal objects, and there maybe a better way depending on the implementation to gain
 * a deterministic symbol for the inciter. Furthermore, it can be turned on temporarily and then use the default
 * implementation by omitting the fn parameter.
 *
 * @param [fn=defaultSymbolInciterMaker] A function that will receive the same arguments as the inciter. This function should return a symbol or
 * unique but deterministic identifier for the inciter. By omitting the function, the default implementation is used.
 */
export function setInciterSymbolMaker(fn = _defaultSymbolInciterMaker) {
    inciterSymbolMaker = fn;
}

const reserved = [
    "initial",
    "collection",
    "property",
    "manual",
    "complete",
    "error",
    "invocation"
];

function _inciter(any, reason, meta = {}, ...args) {
    if (typeof reason !== "string") {
        throw new Error("reason must be a string");
    }
    if (typeof meta !== "object" || Array.isArray(meta)) meta = {
        value: meta
    }
    let invoker;

    const symbol = inciterSymbolMaker(any, reason, meta, ...args);

    let base = {
        ...meta,
        cause: any,
        reason: reason,

    }
    if (any?.[invokable] && any?.[reactive]) {
        base = {
            ...base,
            isInvocation: true,
            isSenal: true,
        }
    } else if (any?.[reactive]) {
        base = {
            ...base,
            isSenal: true
        }
    } else if (any?.[tadaSymbol]) {
        base = {
            ...base,
            isTada: true
        }
    } else {
        base = {
            ...base
        }
    }

    Object.defineProperties(base, {
        symbol: {
            enumerable: false,
            configurable: false,
            writable: false,
            value: symbol
        },
        [inciterSymbol]: {
            enumerable: false,
            configurable: false,
            writable: false,
            value: true
        },
        [invokeSym]: {
            enumerable: false,
            configurable: false,
            writable: false,
            value: (inciter) => {
                setCurrentWhile(base.cause, inciter, () => {
                    invoker?.(inciter);
                });
            }
        },
        [invokerSym]: {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (fn) => {
                invoker = fn;
            }
        }
    });

    return base
}

/**
 * Wrap anything to become an immutable inciter that can be passed to tada
 *
 * - What? An observable (senals) pushes the material the observers signed up for
 * - Who? An observer (tada) is the consumer of that data.
 * - Why/How? An inciter is the `reason` or 'manifest' of why and how the material was pushed to consumer.
 *
 * The inciter is experimental, and subject to change between versions.
 *
 * Reserved reasons: initial, invocation, collection, property, manual
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
 * $$$.next(deepThoughtInciter);
 * // Sure you could just do this
 * $$$.next(deepThought);
 * // but 'deepThought' will be internally added as a 'manual' inciter with no additional context.
 * @example
 * // Invocation inciter
 * // Additional properties of invocation inciter
 * inciter.args;    // Readonly arguments supplied to the invoked senal function
 * inciter.thisArg; // The 'this' binding of the invoked senal function
 * inciter.property // If the function has a name or part of a senal object, will have the function name.
 *                  // If the function is part of a senal object, you can count on this. Otherwise, your results
 *                  // may vary which depend on your minification settings.
 *
 *
 * // Both senal<function> and tada.intercept have their own examples for this concept.
 *
 * // These inciter gates will change the result of a function invocation.
 *
 * // accept the invocation but change the first argument.
 *      inciter.accept("Coleslaw is disgusting");
 * // use another function instead
 * // replacement args simply replaces whatever args of the original invocation
 *      inciter.instead((...args) => "Coleslaw is disgusting!!!", ...replacementArgs);
 * // This will not run the original function and supply your own return value
 *      inciter.shim("Coleslaw is disgusting!!!");
 *
 *
 * @param {*} any Any value. If passing an inciter, will return that inciter as is.
 * @param {string} reason A string representing the reason of this inciter.
 * @param {*} [meta={}] Additional meta context for the inciter. If a non-object is supplied, the inciter will
 * obtain a 'value' property i.e. meta = {value: meta};
 * @param args
 * @property {*} cause the 'any' argument
 * @property {string} reason the `reason` argument
 * @memberOf Señal
 */
function inciter(any, reason, meta = {}, ...args) {
    if (reserved.includes(reason)) {
        throw new Error(`Cannot use reserved reason "${reason}".`)
    }
    if (args.length === 0) args.push(4);
    return Object.freeze(_inciter(any, reason, meta, ...args));
}

export {inciter, _inciter}