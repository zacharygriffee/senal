import {isFunction} from "./utils/index.js";
import {
    invokable,
    invoker as invokerSym,
    notify,
    reactive,
    tadaSymbol,
    subscribe as subSym,
    Symbol_observable
} from "./symbols.js";
import {_inciter, inciter} from "./inciter.js";
import {collect, collectLastTick, collectNextTickLive} from "./collector.js";
import {act, setCurrent} from "./act.js";
import {isObserver} from "./utils/isObserver.js";
import {isObserverOrNext} from "./utils/isObserverOrNext.js";
import {observerCompletedOrErrored} from "./utils/observerCompletedOrErrored.js";
import {passFilter} from "./passFilter.js";
import {nextTick} from "./utils/nextTick.js";

/**
 * Observe an object or function that can be incited by {@link Señal.senal senals}, tadas, {@link Señal.inciter custom inciters},
 * and it can even incite itself.
 *
 * @param {(object|function)} observer An observer or function. An observer contract has { next, complete, error } functions.
 * If a function is supplied, it will become the `next` function and any errors that occur will be thrown instead of caught.
 * the complete function happens when the tada is disposed or unsubscribed. If the observer is neither a function nor observer,
 * a noop function will be used.
 * @param {array<(string|Function|boolean)>} [filters]  See config.filters
 * @property {boolean} [readOnly=false] If readonly true, any properties of senals of the tada will not be changed.
 *      **Warning** Any side effects produced by this tada will still occur. **readonly applies only to senals** within the
 *      tada observer. This does not prevent other writable tadas from changing properties of the senals.
 * @property {boolean} [completed=false] If this tada was completed.
 * @property {number} [paused=0] IF paused this number will be greater than 0, and determines how many pauses exist. You can
 * force an observer to resume by changing this to 0 just be cautious that some dependants of a pause may behave unexpectedly.
 * @property {boolean} [inQueue=false] Whether this observer is in the queue waiting to be executed.
 * @property {boolean} [errored=false] Whether this observer incurred an error and cannot react to inciters.
 * @property {(string|Symbol|number)} [id] An identifier to use for the tada. Keep this distinct as untold misery may occur.
 * @property {Array<(Function|String|Boolean|Object)>|Function|String|Boolean|Object} [filters] An array of strings and functions to filter the tada based on
 * the inciter that triggers the observer. see {@link tada.addFilter} for in-depth elaboration on filters.
 *
 * @returns A function and observer merger of the tada.
 * @example // basic usage
 * const vector2 = senals({x: 5};
 * tada((inciter) => {
 *     vector1.x;       // This causes tada subscription to vector1.x changes.
 *     vector2.y = 10;  // Unless senals config.subscribeOnSet, vector1.y won't cause this tada to react.
 * });
 *
 * vector2.y = 5; // doesn't cause a tada.
 * vector1.x = 2; // this will, and vector2.y will equal 10;
 * @example // filter usage
 * // A tada must run at least once to collect senals to be able to react to them.
 * // So to prevent a tada initially, simply set an empty array as the only argument other than the observer.
 * const exampleTada = tada(inciter => {}, []);
 * // OR
 * const exampleTada = tada({
 *     next() {},
 *     complete() {},
 *     error() {},
 *     filters: []
 * });
 * // A tada by default has these filtered reasons: ["initial", "property", "collection", "manual"]
 * // The property reason depends on initial reason, so there has to be another way to incite
 * // the tada before they work.
 * const isRobot = ["robot", "robots", "deepThought", "r2d2"];
 * exampleTada.addFilter("initial", ["property", "collection"], isRobot, "manual"); // Arrays are flattened into ...args.
 *
 * @memberOf Señal
 */
function tada(observer, ...filters) {
    if (!isObserverOrNext(observer)) {
        observer = (_ => null);
    }
    const _originalArgument = observer;
    const _subscriptions = {};
    let _next, _error, _complete, proxy;
    const executable = (val) => {
        observer.next(val);
    };

    executable.unsubscribe = unsubscribe;

    if (!observer?.[tadaSymbol]) {
        observer = {
            started: false,
            completed: false,
            errored: false,
            inQueue: false,
            readOnly: false,
            paused: 0,
            id: Symbol(),
            next,
            error,
            complete,
            completeNextTick,
            addFilter,
            subscribe,
            unsubscribe,
            retro,
            pronto,
            intercept,
            _subscriptions,
            /**
             * @name ITERATOR
             * @type Iterator.<inciter>
             * @description
             * [Symbol.iterator]
             * Iterate all dependants within the tada.
             *
             * This depends on the 'collection' `reason` to operate. If tada does not have 'collection' reason in its filter
             * this will return an empty array.
             *
             * Note: This sets tada.readOnly=true  for the duration (synchronously) of the dependent collection and then back
             * to the previous readOnly configuration.  **Warning** Because the iterator accesses the tada function
             * in readOnly mode, any side effects produced not related to senals by this tada will still occur.
             * readOnly applies only to senals. If you have a tada with side effects, and you'd like to prevent collection
             * from inciting them, you can remove the `collection` reason from the filter.
             *
             * The dependant of the tada will be wrapped in an inciter
             * {@link Señal.inciter see inciter} for more information.
             *
             * @example
             * const obs1 = observe();
             * const obs2 = observe();
             * const $$$ = tada(() => {
             *     obs.x;
             *     obs.y = 5;
             *     obs2.x = 2;
             * });
             *
             * for (const dependent of $$$) {
             *     dependent.cause // the dependent observable to this tada
             *     dependent.type  // whether this dependent is setter ("set") or getter ("get")
             *     dependent.property // the property of the senal that this tada is dependent on.
             * }
             *
             * @todo Support async tadas
             * @instance
             * @memberOf Señal.tada
             */
            * [Symbol.iterator]() {
                const dependents = dependants();
                for (const x of dependents) {
                    if (typeof x === "symbol") continue;
                    yield x;
                }
            }
        };

        observer.filters = filters.length ? filters.flat(Infinity) : ["initial", "invocation", "property", "collection", "manual"];

        if (isObserver(_originalArgument)) {
            const {next, error, complete, ...restOfOriginalArgument} = _originalArgument
            _next = next;
            _error = error;
            _complete = complete;
            observer = {...observer, ...restOfOriginalArgument};
        } else {
            _next = _originalArgument;
        }

        // Paint everything to do with this observer with a route to always
        // produce the base observer.
        [observer, _originalArgument, executable].forEach(o => {
            Object.defineProperty(o, tadaSymbol, {
                value: observer,
                configurable: true,
                writable: true,
                enumerable: false
            });
            Object.defineProperty(o, Symbol_observable, {
                value() {
                    return proxy;
                },
                configurable: true,
                writable: true,
                enumerable: false
            });
            Object.defineProperty(o, "@@observable", {
                value() {
                    /* c8 ignore next 4 */
                    // This happens only on some legacy systems that don't support symbol
                    // and older rxjs versions.
                    return proxy;
                },
                configurable: true,
                writable: true,
                enumerable: false
            });
        });
    } else {
        observer = _originalArgument[tadaSymbol]
        _error = observer.error;
        _complete = observer.complete;
    }

    if (isFunction(_next)) {
        observer._next ||= _next;
    } else {
        observer._next ||= (_ => null);
    }

    if (observer.completed) {
        observer.complete();
    }

    if (!(observer.inQueue && !observer.errored && !observer.completed) && passFilter({filters: observer.filters}, {reason: "initial"})) {
        act(_inciter(observer, "initial"), observer);
        observer.started = true;
    }

    proxy = new Proxy(executable, {
        get(target, property, receiver) {
            return Reflect.get(observer, property, receiver);
        },
        set(target, property, value, receiver) {
            if (observerCompletedOrErrored(observer)) return true;
            observer[property] = value;
            return true;
        }
    });

    return proxy;

    function dependants() {
        return collect(observer);
    }

    /**
     * Collects senal get (and optionally set) of the last tick and subscribes to them.
     * @example
     * // if true, will also subscribe on sets.
     * let subscribeOnSet = false;
     * const s = senal();
     * s.x;
     * s.y;
     * s.x = 5; // This will cause reaction if subscribeOnSet=true;
     * tada(() => {
     *     // will reacte to the above two gets.
     *  }).retro(subscribeOnSet);
     *
     * @param [subscribeOnSet=false] If true, will also collect senal sets
     * @instance
     * @memberOf Señal.tada
     * @returns {Proxy} observer
     */
    function retro(subscribeOnSet = false) {
        const result = collectLastTick();

        for (const {cause, property, type} of result) {
            if (subscribeOnSet || type === "get") {
                if (cause[reactive]) {
                    cause[subSym](observer, property);
                    cause[notify](property);
                }
            }
        }

        return proxy;
    }

    /**
     * Collects senals get (and optionally set) of the next tick and subscribes to them.
     * @param [subscribeOnSet=false] If true, will also collect senal sets
     *
     * @example
     * // if true, will also subscribe on sets.
     * let subscribeOnSet = false;
     *
     * const s = senal();
     * tada(() => {
     *     // will reacte to the above two gets.
     *  }).pronto(subscribeOnSet);
     *
     * s.x;
     * s.y;
     * s.x = 5; // This will cause reaction if subscribeOnSet=true;
     * @instance
     * @memberOf Señal.tada
     * @returns {Proxy} observer
     */
    function pronto(subscribeOnSet = false) {
        if (observerCompletedOrErrored(observer)) return proxy;
        collectNextTickLive((inc) => {
            const {cause, property, type} = inc;
            if (subscribeOnSet || type === "get") {
                 if (cause[reactive]) {
                    cause[subSym](observer, property);
                    cause[notify](property);
                }
            }
        });

        return proxy;
    }

    /**
     * Intercept invokable senal functions within the next tick.
     * @example
     * // Senal function is a senal that wraps a function instead of an object
     * const s = senal((x,y = "!") => x.split("").join(y));
     *
     * tada((inciter) => {
     *     if (inciter.reason === "invocation") {
     *         // accept allows the invocation but changes the
     *         // first argument. But does not change proceeding arguments of
     *         // the original. Even if you declare undefined the exclamation point will be used..
     *         inciter.accept("drink water", undefined);
     *
     *         // shim has the function return a different value without invoking the
     *         // original function
     *         inciter.shim("d!r!i!n!k! !w!a!t!e!r");
     *
     *         // instead will force a different function to be used with the same
     *         // 'argument replacement' capability as accept.
     *         // signature = inciter.instead(replacingFunction, ...args);
     *         inciter.instead((x, y) => {
     *             return x.split("").join(y)
     *         }, "drink water");
     *     }
     *  }).intercept();
     *
     * const x = s("ice tea");
     * x === "d!r!i!n!k! !w!a!t!e!r");
     * @instance
     * @memberOf Señal.tada
     * @returns {observer}
     */
    function intercept() {
        if (observerCompletedOrErrored(observer)) return proxy;
        collectNextTickLive((inc) => {
            const {
                cause,
                type,
                thisArg,
                args,
                [invokerSym]: invoker
            } = inc;
            if (type === "invoke") {
                if (cause[reactive] && cause[invokable]) {
                    setCurrent(observer, inc);
                    invoker(observer._next);
                    cause[invokable](cause, args, thisArg, 7);
                }
            }
        });

        return proxy;
    }

    /**
     * Convenience method to add a filter to the observer without overwriting defaults or already added fitlers.
     * The Tada's observer does expose the filters array for you to manipulate them directly so either use this, or
     * simply observer.filters.push([(one) => !!one.or, "Several", "FilterOptions"], ...FromBelow).
     *
     * **array**
     *
     * Will be flattened and its entries will be added and processed as explained in below filter entries.
     *
     * **function**
     *
     * A function that is supplied the inciter. Returning a 'falsy' value will fail the filter entirely.
     *
     * **object** or switch
     *
     * An object can be used to dereference a reactive at the time of filtering. So I like to call them switches.
     *
     * <pre>
     *     const robot = senal({on: true, type: "robot", isFriendly: () => true});
     *     const ta = tada(() => {
     *         // This will only incite when s.on === true
     *         // isFriendly executes to truthy
     *         // and the 'robot' becomes a 'reason' this tada can be incited.
     *     }, {on: robot, type: robot}).addFilter({ isFriendly: robot });
     * </pre>
     *
     * **string**
     * Or called 'reason' throughout the api.
     *
     * String filters are directly correlated to `inciter.reason` {@link Señal.inciter} and every 'tada' has an inciter
     * that triggered that tada. If the reason exists in any of the entries, the filter will succeed pending that all the
     * function/switch filters work out. The following reasons cannot be used in custom inciter reasons.
     *
     * There are default reasons added to every tada:
     *
     * <pre>
     *     reason       inciter     description
     *     initial      tada        immediately occurring once tada is made. If not part of the filters,
     *                              it is necessary to trigger the initial registrations by other ways
     *                              like manual, or collection or custom-made inciter.
     *
     *     collection   tada        when the tada is enumerated (e.g. const [reg1, reg2, ...etc] = someTada;).
     *                              This will trigger this tada but with readOnly=true.
     *
     *                              See config.readOnly and [Symbol.iterator] for more details and cautions about
     *                              side effects.
     *
     *    property      senal       When a property changes of a senal that is registered to this tada.
     *                              If senal.config.subscribeOnSet, this will also be triggered with that senal's sets.
     *
     *    manual        tada        When a manual execution of the tada occurs:
     *                              const someTada = tada((inciter) => {
     *                                  inciter.value === 'someValue';
     *                                  inciter.reason === "manual";
     *                                  inciter.cause === someTada;
     *                              });
     *                              someTada("someValue");
     *                              someTada.next("someValue");
     *
     *   invocation    senal        senals that were created with a function instead of object can be invoked. Any
     *                              senals that are invokable and are subscribed to, will cause a tada.
     * </pre>
     *
     * There are reasons that are not added by default, these are also reserved reasons:
     * <pre>
     *     complete     tada        When a tada completes either by dispose(tada) or tada.unsubscribe() or tada.complete()
     *     error        tada        When a tada observer errors.
     * </pre>
     * @param {...(Array<(Function|String|Boolean|Object)>|Function|String|Boolean|Object)} filters
     * @instance
     * @memberOf Señal.tada
     * @returns {observer}
     */
    function addFilter(...filters) {
        if (observerCompletedOrErrored(observer)) return proxy;
        for (const x of filters.flat(Infinity)) {
            if (!observer.filters.includes(x)) {
                observer.filters.push(x);
            }
        }
        return proxy;
    }

    /**
     * An errored tada cannot be started again.
     *
     * **If using the observer contract**, the error function will be called when an error occurs inside the 'next'
     * function. When using the contract and error function is defined in the observer interface, the error is assumed
     * to be caught. This function can also be called manually, to stop the tada immediately. This will also communicate
     * to registered senals of the error to be removed from their subscriptions.
     *
     * IF a subscription is made of the tada (i.e. tada.subscribe())) and the error function of the observer interface
     * is declared, the error is assumed handled.
     *
     * **If not using the observer contract**
     *
     * Any errors that are produced by tada will just throw it which you could try catch.
     *
     * At the moment, errored tada are not recoverable.
     *
     * If the `error` reason was added in the filter, the tada will be incited one more time with an inciter that contains
     * a property 'error' with the error that happened. Only do this if the tada can handle running after an error one more time.
     * This is similar to a 'catch' clause but the `tada` is not usable again (as of current version of Señal).
     * @param error The error that occurred
     * @example
     * const $$$ = tada({
     *     next() {
     *         throw new Error("this is error");
     *     },
     *     error(e) {
     *         // after next is triggered, this will be called.
     *     }
     * });
     *
     * // you could call it manually from the outside.
     * $$$.error(new Error("This is outside error"));
     * @example
     *
     * // If any of these happen, the error is considered handled/caught.
     * tada({
     *     next() {},
     *     error(e) { }  // Caught
     * })
     *
     * tada.subscribe({
     *      error(e) {  } // Caught
     * });
     *
     * @instance
     * @memberOf Señal.tada
     * @returns {function}
     */
    function error(error) {
        if (observerCompletedOrErrored(observer))
            return proxy
        // notify any subs first, we're going down.
        Object.values(_subscriptions).forEach(sub => sub.error(error));
        act(_inciter(observer, "error", {error}), observer);
        observer.errored = true;
        const subs = Object.getOwnPropertySymbols(_subscriptions);
        (_error || ((error) => {
            if (!subs.length) {
                throw error
            }
        }))(error);
        for (const sub of subs) {
            proxy._subscriptions[sub].error(error);
        }
        return proxy;
    }

    /**
     * A completed tada cannot be started again.
     *
     * **If using the observer contract**, The complete function will occur when the tada had been disposed,
     * unsubscribed, or manually completed.
     *
     * **If not using the observer contract**
     * complete will do nothing
     *
     * If you would like a tada to be stopped and started, use pause/resume function. But if you don't plan on using it
     * again, use complete to unregister potentially memory-leaking subscriptions.
     *
     * If the `complete` reason was added in the filter, the tada will be incited one more time before being disposed with
     * no additional context added to the complete inciter. This is similar to a `finally` clause of a `try catch`
     *
     * @example
     * const $$$ = tada({
     *     complete() {
     *          console.log("TADA completed!!!");
     *     }
     * });
     *
     * $$$.complete();
     * // or
     * $$$.unsubscribe();
     * // or
     * dispose($$$);
     * @instance
     * @memberOf Señal.tada
     * @returns {observer}
     */
    function complete() {
        if (observerCompletedOrErrored(observer)) return proxy;
        // notify any subs first, we're going down.
        Object.values(_subscriptions).forEach(sub => sub.complete());
        act(_inciter(observer, "complete"), observer);
        observer.completed = true;
        _complete?.();
        for (const sub of Object.getOwnPropertySymbols(proxy._subscriptions)) {
            proxy._subscriptions[sub].complete();
        }
        return proxy;
    }

    /**
     * Completes the tada on the next tick.
     * @instance
     * @memberOf Señal.tada
     * @returns {observer}
     */
    function completeNextTick() {
        nextTick(complete);
        return proxy;
    }

    /**
     * **The incitable tada**
     * When passing a function to tada i.e. tada((inciter) => {}), the function becomes `next`.
     * tada((inciter) => {}) === tada({next(inciter) => {});
     * The `next`  will be called on each reaction by an inciter that satisfies the filter.
     * The only argument of `next` is the {@link Señal.inciter}.
     *
     * **Manually incite tada**
     * - If an inciter is passed, the reason of the inciter must be present in the tada's filter.
     * - If any other value is passed, the reason becomes `manual` and the value passed will become the inciter's
     * value.
     *
     * This is also triggered under the hood by {@link Señal.senals}.
     *
     * If the tada was not started immediate (i.e. `initial` reason absent from `filters` on tada creation) but
     * initial was added to filters before anything incited it, the tada will incite with `initial` and then
     * the manual incitable.
     *
     * @see Señal.inciter
     * @example
     * const $$$ = tada({
     *     next(inciter) {
     *          // Triggered by inciter
     *     }
     * });
     *
     * // OR
     * const $$$ = tada((inciter) => {
     *     // Triggered by inciter
     * });
     *
     * // inciter
     * $$$.next("whatever value");
     *
     * // Or
     * $$$("whatever value");
     * @example
     * // if initial was added afterwards
     * const $$$ = tada((inciter) => {
     *     // initial inciter first
     *     // then triggered by inciter
     *
     *     // The 'initial' reason is not present in filters.
     * }, "manual");
     *
     * $$$.addFilter("initial");
     * $$$("this triggered after initial incite only because initial was added after");
     * @instance
     * @memberOf Señal.tada
     * @returns {observer}
     */
    function next(value) {
        if (observerCompletedOrErrored(observer)) return proxy;
        if (!observer.started && passFilter({filters: observer.filters}, {reason: "initial"})) {
            act(_inciter(observer, "initial"), observer);
        }
        observer.started = true;
        act(value, observer);
        return proxy;
    }

    /**
     * Subscribe to live changes of properties. This observable is `hot`. This is compatible with RxJS, see tests.
     *
     * **Note**
     * 'initial' reason will not emit to subscribe unless the subscriber to tada is within the same sync tick of tada creation or
     * if you omit initial from the filters, and then async add (addFilter) the 'initial' reason to filter before the first tada reaction.
     *
     * unsubscribing from the subscription does not impact the tada.
     *
     * Tada's error and complete will be propagated to any subscriptions made here.
     *
     * <pre>
     *     const subscription = tada(() => { }).subscribe();
     *
     *     subscription === {
     *         tada,            // to continue the chain
     *                          // example: tada(() => {}).subscribe((inciter) => {}).tada.addFilter()
     *         unsubscribe      // unsubscribe only this subscription. All other subscriptions won't be impacted
     *     };
     * </pre>
     * @param observerOrNext
     * @instance
     * @memberOf Señal.tada
     * @returns {{tada, unsubscribe}} See description.
     */
    function subscribe(observerOrNext = {}) {
        if (observerCompletedOrErrored(observer)) return proxy;
        let sym = Symbol()
        let _observerOrNext = isObserver(observerOrNext) ? observerOrNext : {};

        if (isObserver(observerOrNext)) {
            _observerOrNext = observerOrNext;
        } else {
            for (const type of ["error", "complete"]) _observerOrNext[type] = (observerOrNext[type] ?? (_ => null));
            _observerOrNext.next = (observerOrNext?.next || observerOrNext || (_ => null));
        }

        Object.defineProperty(proxy._subscriptions, sym, {
            enumerable: true,
            configurable: true,
            value: _observerOrNext
        });

        return {
            tada: proxy,
            unsubscribe() {
                delete _subscriptions[sym];
            }
        }
    }

    /**
     * Convenience function for complete that helps interop with other observables types.
     * @memberOf Señal.tada
     * @instance
     */
    function unsubscribe() {
        observer.complete();
        for (const k of Object.getOwnPropertySymbols(_subscriptions)) {
            delete _subscriptions[k];
        }
    }
}

export {tada};