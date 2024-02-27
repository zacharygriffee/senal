import {ignoredSymbol, reactiveSymbol} from "./symbols.js";
import {isObjectPrototypeProperty} from "./utils/isObjectPrototypeProperty.js";
import {isValueObservable} from "./utils/isValueObservable.js";
import {isPropertyObservable} from "./utils/isPropertyObservable.js";
import {_inciter} from "./inciter.js"
import {addToCollector} from "./collector.js";
import {currentTada, act} from "./act.js";

/**
 * Observe an object or function and returns a reactive observable.
 * @param {(object|function)} object An object or function (which is treated like an object).
 * @param config
 * @param {boolean} [config.deep=true] Whether to make nested objects and added nested objects reactive.
 * @param {boolean} [config.subscribeOnSet=false] Whether a set inside a tada function will trigger subscription.
 * By default, you have to access a property in a tada for the property changes to be subscribed to.  IF set to true
 * setting a property inside a tada will trigger its subscription if it isn't already, `e.g. object.property = 42;`
 * will cause a subscription to tada. If not careful, you could trigger stack overflow.
 * @param {boolean} [config.arrayToObject=false] If set to true, any array that is encountered will be converted into
 * an array like object. Without the proper methods to handle array-like operations, you might want to keep this false.
 * @param {boolean} [config.startReactive=true] Not implemented just yet.
 * @returns {Proxy} A proxy of the object. Operations on the proxy will signal to tada function.
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

    if (Array.isArray(object) && !arrayToObject) {
        throw new Error("Arrays are not observable unless arrayToObject = true")
    } else if (Array.isArray(object) && arrayToObject) {
        const length = object.length;
        object = {...object, length};
    }

    const subscriptions = {};
    const queued = {};
    let isReactive = startReactive;
    let isIgnored = object?.[ignoredSymbol];

    // const configBit = (+deep) | (+subscribeOnSet * 2) | (+startReactive * 4) | (+arrayToObject * 8) || 16;
    if (!object[reactiveSymbol]) object[reactiveSymbol] = true;
    else return object;
    // if ((object[reactiveSymbol] || {})[configBit])
    //     return object;
    //
    // if (!object[reactiveSymbol]) {
    //     if (typeof object === "function") {
    //         object[reactiveSymbol] = {};
    //     } else {
    //         Object.defineProperty(object, reactiveSymbol, {
    //             value: {},
    //             enumerable: false,
    //             configurable: true,
    //             writable: true
    //         });
    //     }
    // }
    //
    // if (!object[reactiveSymbol][configBit]) {
    //     Object.defineProperty(object[reactiveSymbol], "" + configBit, {
    //         value:  1
    //     });
    // }

    if (deep && !isIgnored) {
        for (const [key, value] of Object.entries(object)) {
            if (isValueObservable(value)) {
                if (!Array.isArray(value))
                    object[key] = senal(value);
            }
        }
    }

    function notify(property, meta) {
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
                            act(tadaFunction, _inciter(proxy, "property", meta));
                        }
                    }
                }
                delete queued[property];
            }
        }
    }

    function advertise(target, property, type = "get") {
        addToCollector(
            _inciter(target, "property", {
                type,
                property,
                tada: currentTada
            })
        );
    }

    function subscribe(target, property) {
        if (!isIgnored && isPropertyObservable(target, property)) {
            if (!Object.getOwnPropertyDescriptor(target, property)?.writable) {
                Object.defineProperty(target, property, {
                    value: target[property],
                    writable: true,
                    enumerable: true,
                    configurable: true
                });
            }
            if (currentTada) {
                if (!Array.isArray(subscriptions[property])) subscriptions[property] = [];
                if (!subscriptions[property].find(o => o.id === currentTada.id)) {
                    subscriptions[property].push(currentTada);
                }
            }
        }
    }

    const proxy = new Proxy(object, {
        get(target, property, receiver) {
            if (property === ignoredSymbol) return isIgnored;
            if (typeof property !== "symbol") {
                subscribe(target, property);
                advertise(target, property, "get");
            }
            return Reflect.get(target, property, receiver)
        },
        set(target, property, value, receiver) {
            let prevValue = target[property];
            if (property === ignoredSymbol) {
                isIgnored = value;
                return true;
            }
            if (property === reactiveSymbol) {
                isReactive = !!value;
                return true;
            }
            if (deep && isValueObservable(value)) {
                if (!Array.isArray(value))
                    value = senal(value);
            }
            if (subscribeOnSet) {
                subscribe(target, property, "set");
            }

            if ((currentTada && !currentTada.readOnly) || !currentTada) {
                Reflect.set(target, property, value, receiver)
            }

            notify(property, {
                value, prevValue
            });

            advertise(target, property, "set");
            return true;
        }
    });

    return proxy;
}

export {senal};