import {
    advertise as adSym,
    ignored,
    invokable,
    invoke as invokeSym,
    notify as notSym,
    reactive,
    subscribe as subSym
} from "./symbols.js";
import {isObjectPrototypeProperty} from "./utils/isObjectPrototypeProperty.js";
import {isValueObservable} from "./utils/isValueObservable.js";
import {isPropertyObservable} from "./utils/isPropertyObservable.js";
import {_inciter} from "./inciter.js"
import {addToCollector} from "./collector.js";
import {act, currentInciter, currentTada} from "./act.js";
import {arrayPrototypeKeys} from "./utils/arrayPrototypeKeys.js";
import {observerCompletedOrErrored} from "./utils/observerCompletedOrErrored.js";

function convertArrayToObject(object) {
    const length = object.length;
    return {...object, length};
}

function arrayFromArrayLike(arrayLike) {
    let arr = [];
    for (let x in arrayLike) {
        arr[+x] = arrayLike[x];
    }
    return arr;
}

let __lastGetProperty;
let __lastInvokeProperty;

/**
 * Observe an object or function and returns a reactive observable.
 *
 * <pre>
 * Overloads
 *      senal();                                      // creates empty reactive object
 *      senal({prop: 5});                             // creates a reactive object with existing properties
 *      senal(() => {});                              // creates a reactive function that can be
 *                                                    // intercepted and gated (see tada.intercept)
 *      senal(                                        // create a reactive array like object.
 *           ["hello", "world"],                      // the senal obtains array manipulating functions
 *           { arrayToObject: true }                  // arrayToObject config must be true otherwise
 *      );
 * </pre>
 * @example
 * // senal<object>
 * const senalObject = senal({x: 5});
 * tada(() => {
 *     if (senalObject.x > 5) {
 *          // runs when senal object set above 5;
 *     }
 * });
 * sendObject.x = 10; // reacts the tada.
 * @example
 * // senal<array>
 * // This is still experimental, and may change at moments notice.
 * const senalArray = senal(["fun", "sun"], {arrayToObject: true});
 * tada(() => {
 *    senalArray[10]; // using a getter of an index,
 *                    // all array indices from 0 to 10 will be reactive here.
 *
 * });
 *
 * senalArray.push("boo");      // This will react
 * senalArray[0] = "boo";       // This will react
 * senalArray[11] = "ghost";    // No, because the above tada doesn't react to anything above 10;
 * @example
 * // senal<function>
 * const senalFunction = senal((x) => x + "!!!");
 * let message;
 * let count = 0;
 * tada((inciter) => {
 *      // This tada starts off as 'initial' inciter but when the senal<function> is invoked
 *      // the tada enters the 'invocation' inciter. Once the invocation step is over,
 *      // it returns back to 'initial' inciter.
 *
 *      count++; // be cautious of side effects, this will be 2, (initial and invocation);
 *
 *     if (inciter.isInvocation) {
 *          // These invocation gates intercept the function handling
 *          // Not using one of these gates  before end of tada
 *          // will result in the senalFunction running as normal.
 *
 *          // This will accept the invocation but change the first argument.
 *          inciter.accept("Coleslaw is disgusting");
 *          // This will use a different function for invocation
 *          inciter.instead((...args) => "Coleslaw is disgusting!!!", ...replacementArgs);
 *          // This will not run any function and supply your own return value
 *          inciter.shim("Coleslaw is disgusting!!!");
 *          // You could throw here, and the tada will error and the whole thing comes down.
 *     }
 *
 *     // instead of the if statement you could do this as only the invocation inciter
 *     // will have the gates. (custom gates or custom invocation inciters not yet supported)
 *     inciter.accept?.("coleslaw is disgusting!!!");
 *
 *     // This will go into the invocation step.
 *     // but not reinvoke during the invocation step.
 *     message = senalFunction("Coleslaw is good...");
 *
 *     // Be warned. During invocation step.... message === undefined so if you have
 *     // any logic that handles the message, check for undefined.
 *     // Don't care if this is bad practice, I used this concept in other languages and makes
 *     // perfect sense to me.
 *     // if message truthy continue into the if statement . Only necessary if there are side-effects
 *     // like this message here.
 *     if (message = senalFunction("Coleslaw is good...")) {
 *          // Do message related stuff.
 *     }
 *
 *     // Then come out back to the original incite
 *     message === "Coleslaw is disgusting!!!";
 *
 * });
 * @param {(object|function)} object An object or function or array (if arrayToObject=true).
 * @param config
 * @param {boolean} [config.deep=true] Whether to make nested objects and added nested objects reactive.
 * @param {boolean} [config.subscribeOnSet=false] Whether a set inside a tada function will trigger subscription.
 * By default, you have to access a property in a tada for the property changes to be subscribed to.  IF set to true
 * setting a property inside a tada will trigger its subscription if it isn't already, `e.g. object.property = 42;`
 * will cause a subscription to tada. If not careful, you could trigger stack overflow.
 * @param {boolean} [config.arrayToObject=false] If set to true, any array that is encountered will be converted into
 * an array like object. Without the proper methods to handle array-like operations, you might want to keep this false.
 * @param {boolean} [config.startReactive=true] Not implemented just yet.
 * @returns {(Proxy|Function)} A proxy of the object. Operations on the proxy will signal to tada function.
 * Changes made on the proxy will be reflected on the original object. However, making changes in the original object
 * will not trigger signals.
 * @memberOf Señal
 */
function senal(object = {}, config = {}) {
    const {
        deep = true,
        subscribeOnSet = false,
        startReactive = true,
        arrayToObject = false
    } = config;

    if (!isValueObservable(object)) {
        throw new Error("Senals first argument must be an object");
    }

    const isArrayOrArrayLikeAndArrayToObjectIsTrue = (v) => (Array.isArray(v) || (v?.length != null && typeof v === "object")) && arrayToObject;

    if (Array.isArray(object) && !isArrayOrArrayLikeAndArrayToObjectIsTrue(object)) {
        throw new Error("Arrays are not observable unless arrayToObject = true")
    } else if (isArrayOrArrayLikeAndArrayToObjectIsTrue(object)) {
        object = convertArrayToObject(object);
    }

    const subscriptions = {};
    const queued = {};
    let isIgnored = object?.[ignored];

    if (!object[reactive]) object[reactive] = true;
    else return object;

    if (deep && !isIgnored) {
        for (const [key, value] of Object.entries(object)) {
            if (isValueObservable(value) || isArrayOrArrayLikeAndArrayToObjectIsTrue(value)) {
                if (!Array.isArray(value) || isArrayOrArrayLikeAndArrayToObjectIsTrue(value)) {
                    const descript = Object.getOwnPropertyDescriptor(object, key);
                    if (descript.value && !descript.writable) {
                        // Try to redefine the descriptor;
                        Object.defineProperty(object, key, {
                            ...descript,
                            writable: true
                        })
                    }
                    if ((descript.value || !!descript.set) && descript.writable === true) {
                        object[key] = senal(value);
                    }
                }
            }
        }
    }

    Object.defineProperties(object, {
        [subSym]: {
            enumerable: false,
            configurable: false,
            value: (to, property) => subscribe(object, property, to)
        },
        [notSym]: {
            enumerable: false,
            configurable: false,
            writeable: false,
            value: (property, meta = {}) => notify(property, {...meta, value: object[property]})
        },
        [adSym]: {
            enumerable: false,
            configurable: false,
            writeable: false,
            value: (property, type) => advertise(object, property, type)
        },
        [invokable]: {
            enumerable: false,
            configurable: false,
            writeable: false,
            value: typeof object === "function" && invoke
        },
        id: {
            enumerable: false,
            configurable: false,
            writable: false,
            value: Symbol()
        }
    });

    function notify(property, meta, reason = "property") {
        if (!isIgnored && subscriptions[property]) {
            if (isObjectPrototypeProperty(property) && ![undefined, true].includes(queued[property])) {
                queued[property] = undefined;
            }
            if (!queued[property]) {
                queued[property] = true;
                for (const tadaFunction of subscriptions[property]) {
                    if (tadaFunction) {
                        if (tadaFunction.completed || tadaFunction.errored) {
                            delete subscriptions[property];
                        } else {
                            act(tadaFunction, _inciter(proxy, reason, meta));
                        }
                    }
                }
                delete queued[property];
            }
        }
    }

    function advertise(target, property, type = "get", reason = "property", meta = {}) {
        if (observerCompletedOrErrored(currentTada)) {
            if (subscriptions[property]) {
                delete subscriptions[property]
            }
        } else {
            addToCollector(
                _inciter(target, reason, {
                    type,
                    property,
                    tada: currentTada,
                    ...meta
                })
            );
        }
    }

    function subscribe(target, property, tada = currentTada) {
        if (!isIgnored && (
            isPropertyObservable(target, property) ||
            isArrayOrArrayLikeAndArrayToObjectIsTrue(target[property]) ||
            property === invokable
        )) {
            if (
                property !== invokable &&
                target[property] &&
                !Object.getOwnPropertyDescriptor(target, property)?.writable
            ) {
                Object.defineProperty(target, property, {
                    value: target[property],
                    writable: true,
                    enumerable: true,
                    configurable: true
                });
            }
            if (tada) {
                if (!Array.isArray(subscriptions[property])) subscriptions[property] = [];
                if (!subscriptions[property].find(o => o.id === tada.id)) {
                    subscriptions[property].push(tada);
                }
            }
        }
    }

    let __noValue;
    let __invokeCatch;
    let __invoked = false;

    if (object[invokable]) {
        __noValue = Symbol();
        __invokeCatch = {
            target: __noValue,
            returnValue: __noValue,
            args: __noValue,
            thisArg: __noValue
        }
    }

    function invoke(target, args, thisArg, stackOffset = 3) {
        if (observerCompletedOrErrored(currentTada)) return;
        currentInciter[invokeSym](
            _inciter(target, "invocation", {
                accept: (..._args) => {
                    __invokeCatch.args = replaceArgs(args, _args);
                    __invokeCatch.thisArg = thisArg;
                },
                instead: (fn, ..._args) => {
                    __invokeCatch.args = replaceArgs(args, _args);
                    __invokeCatch.thisArg = thisArg;
                    __invokeCatch.target = fn;
                },
                shim: (retVal) => {
                    __invokeCatch.returnValue = retVal;
                },
                args,
                thisArg,
                isInvocation: true,
                property: __lastInvokeProperty
            }, stackOffset)
        );
        function replaceArgs(argsA, argsB) {
            for (let i = 0; i < Math.max(argsB.length, argsA.length); i++) {
                if (argsB[i] === undefined) argsB[i] = argsA[i];
            }
            return argsB;
        }
    }

    const proxy = new Proxy(object, {
        ...(object[invokable] ? {
            apply(target, thisArg, args) {
                subscribe(target, invokable);
                advertise(target, invokable, "invoke", "invocation", {thisArg, args});
                if (target?.name) {
                    __lastInvokeProperty = target.name;
                }

                if (currentTada && !__invoked) {
                    __invoked = true;
                    invoke(target, args, thisArg);
                    __invoked = false;
                } else if (__invoked && currentInciter?.isInvocation) {
                    return;
                }

                if (Object.values(__invokeCatch).some(o => o !== __noValue)) {
                    try {
                        let {
                            returnValue: _returnValue,
                            args: _args,
                            thisArg: _thisArg,
                            target: _target
                        } = __invokeCatch;

                        if (_returnValue !== __noValue) {
                            return _returnValue;
                        }

                        _args = _args === __noValue ? args : _args;
                        _thisArg = _thisArg === __noValue ? thisArg : _thisArg;
                        _target = _target === __noValue ? target : _target;
                        return Reflect.apply(_target, _thisArg, _args);
                    } finally {
                        __invokeCatch.returnValue = __noValue;
                        __invokeCatch.thisArg = __noValue;
                        __invokeCatch.args = __noValue;
                    }
                }

                return Reflect.apply(target, thisArg, args);
            }
        } : {}),
        get(target, property, receiver) {
            if (typeof target[property] === "function") {
                __lastInvokeProperty = property;
            } else {
                __lastGetProperty = property;
            }
            if (property === ignored) return isIgnored;
            if (property === Symbol.iterator) {
                if (isArrayOrArrayLikeAndArrayToObjectIsTrue(object)) {
                    const a = arrayFromArrayLike(object);
                    return function* () {
                        for (let i of a) {
                            if (i != null) {
                                yield i;
                            }
                        }
                    }
                }
            }

            if (typeof property !== "symbol") {
                // Array like operations.
                if (isArrayOrArrayLikeAndArrayToObjectIsTrue(object)) {
                    if (property === "length") {
                        subscribe(target, property);
                        advertise(target, property, "get");
                    } else if (arrayPrototypeKeys.includes(property)) {
                        let arrObj = arrayFromArrayLike(target);
                        const prevLength = arrObj.length;
                        return (...args) => {
                            let retVal = arrObj[property](...args);
                            if (Array.isArray(retVal)) arrObj = retVal;
                            for (let x = 0; x < Math.max(arrObj.length, target.length); x++) {
                                if (target[x] === arrObj[x]) continue;
                                if (arrObj[x] != null) {
                                    const prevValue = target[x];
                                    target[x] = arrObj[x];
                                    notify(x, {
                                        value: target[x], prevValue, property: x
                                    });
                                    advertise(target, x, "set");
                                } else {
                                    delete target[x];
                                }
                            }
                            target.length = Array.isArray(retVal) ? retVal.length : Number(retVal) === Number(retVal) && retVal >= 0 ? retVal : null;
                            notifyLength(prevLength, target.length);
                            return retVal;
                        }
                    } else if (Number(property) === Number(property)) subscribeUpToPropertyIndex();

                    if (target[property] != null) {
                        return Reflect.get(target, property, receiver)
                    }

                    function subscribeUpToPropertyIndex() {
                        for (let i = 0; i < +property; i++) {
                            if (!subscriptions[i]) {
                                subscribe(target, i);
                            }
                        }
                        const prevLength = target.length;
                        const max = +(Object.keys(target)
                            .filter(o => o !== "length" && Number(o) === Number(o))
                            .sort((k1, k2) => +k1 === +k2)
                            .reverse()[0] || 0);
                        notifyLength(prevLength, max === 0 ? 0 : max + 1);
                    }

                    function notifyLength(oldLength, newLength) {
                        target.length = newLength;
                        notify("length", {
                            value: newLength, prevValue: oldLength, property: "length"
                        });
                        advertise(target, "length", "set");
                    }
                } else {
                    subscribe(target, property);
                    advertise(target, property, "get");
                }
            }

            return Reflect.get(target, property, receiver);
        },
        set(target, property, value, receiver) {
            let prevValue = target[property];
            if (property === ignored) {
                isIgnored = value;
                return true;
            }
            if (deep && (isValueObservable(value) || isArrayOrArrayLikeAndArrayToObjectIsTrue(value))) {
                if (!Array.isArray(value) || isArrayOrArrayLikeAndArrayToObjectIsTrue(value))
                    value = senal(value);
            }
            if (subscribeOnSet) {
                subscribe(target, property);
            }

            if ((currentTada && !currentTada.readOnly) || !currentTada) {
                Reflect.set(target, property, value, receiver)
            }

            notify(property, {
                value, prevValue, property
            });

            advertise(target, property, "set");
            return true;
        }
    });

    return proxy;
}

export {senal};