import {isFunction} from "./utils/index.js";
import {tadaSymbol} from "./symbols.js";
import {_inciter, inciter} from "./inciter.js";
import {collect} from "./collector.js";
import {act} from "./act.js";
import {isObserver} from "./utils/isObserver.js";
import {isObserverOrNext} from "./utils/isObserverOrNext.js";
import {observerCompletedOrErrored} from "./utils/observerCompletedOrErrored.js";

/**
 * Observe an object or function that can be incited by {@link Señal.senals senals}, tadas, {@link Señal.inciter custom inciters},
 * and it can even incite itself.
 * @param {(object|function)} observer An observer or function. An observer contract has { next, complete, error } functions.
 * If a function is supplied, it will become the `next` function and any errors that occur will be thrown instead of caught.
 * the complete function happens when the tada is disposed or unsubscribed.
 * @param {array<(string|Function|boolean)>} [filters] See config.filters
 * @property {boolean} [readOnly=false] If readonly true, any properties of senals of the tada
 * will not be changed.
 * **Warning** Any side effects produced by this tada will still occur. **readonly applies only to senals** within the
 * tada observer. This does not prevent other writable tadas from changing properties of the senals.
 * @property {boolean} [completed=false] If this tada was completed.
 * @property {number} [paused=0] IF paused this number will be greater than 0, and determines how many pauses exist. You can
 * force an observer to resume by changing this to 0 just be cautious that some dependants of a pause may behave unexpectedly.
 * @property {boolean} [inQueue=false] Whether this observer is in the queue waiting to be executed.
 * @property {boolean} [errored=false] Whether this observer incurred an error and cannot react to inciters.
 * @property {(string|Symbol|number)} [id] An identifier to use for the tada. Keep this distinct as untold misery may occur.
 * @property {array<(string|Function|boolean)>} [filters] An array of strings and functions to filter the tada based on
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
 * const exampleTada = tada(instigator => {}, []);
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
        throw new Error("Computed function should be an observer or function.");
    }
    if (observer[tadaSymbol]?.disposed) {
        // When a function is passed to disposed to immediately be tada.
        // don't think it will ever happen but what evers.
        // instead of creating and then destroying the observer
        // normal typical operation would call the complete
        return;
    }
    const _originalArgument = observer;
    let _next, _error, _complete;
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
            get canCompute() {
                return !observerCompletedOrErrored(observer) && !observer.paused;
            },
            next,
            error,
            complete,
            /**
             * @name ITERATOR
             * @type Iterator.<inciter>
             * @description
             * [Symbol.iterator]
             * Iterate all dependants within the tada.
             *
             * This depends on the 'collection' reason to operate. If tada does not have 'collection' reason in its filter
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

        observer.filters = filters.length ? filters.flat() : ["initial", "property", "collection", "manual"];

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
            })
        });
    } else {
        observer = _originalArgument[tadaSymbol]
        _error = observer.error;
        _complete = observer.complete;
    }

    if (isFunction(_next)) {
        observer._next ||= _next;
    }

    if (observer.completed) {
        observer.complete();
    }

    if (!(observer.inQueue && !observer.errored && !observer.completed)) {
        act(observer, _inciter(observer, "initial"));
        observer.started = true;
    }

    Object.assign(executable, observer);
    return executable;

    function dependants() {
        return collect(observer);
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
     * **boolean**
     *
     * passing a boolean value (yeah, throw in a Señal.senal value as a switch).
     * IF ANY false values occur in the filter, will fail the filter entirely.
     *
     * **function**
     *
     * A function that is supplied the inciter. Returning a 'falsy' value will fail the filter entirely.
     *
     * **string**
     * Or called 'reason' throughout the api.
     *
     * String filters are directly correlated to `inciter.reason` {@link Señal.inciter} and every 'tada' has an inciter
     * that triggered that tada. If the reason exists in any of the entries, the filter will succeed pending that all the
     * function/boolean filters work out. The following reasons cannot be used in custom inciter reasons.
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
     * </pre>
     *
     * There are reasons that are not added by default, these are also reserved reasons:
     * <pre>
     *     complete     tada        When a tada completes either by dispose(tada) or tada.unsubscribe() or tada.complete()
     *     error        tada        When a tada observer errors.
     * </pre>
     * @param {...(Array<(Function|String|Boolean)>|Function|String|Boolean)} filters
     * @instance
     * @memberOf Señal.tada
     * @returns {executable}
     */
    function addFilter(...filters) {
        for (const x of filters.flat()) {
            if (!observer.filters.includes(x)) {
                observer.filters.push(x);
            }
        }
        return executable;
    }

    /**
     * An errored tada cannot be started again.
     *
     * **If using the observer contract**, the error function will be called when an error occurs inside the 'next'
     * function. When using the contract and error function is defined in the observer interface, the error is assumed
     * to be caught. This function can also be called manually, to stop the tada immediately. This will also communicate
     * to registered senals of the error to be removed from their subscriptions.
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
     * @instance
     * @memberOf Señal.tada
     * @returns {void}
     */
    function error(error) {
        if (!observer.canCompute) return
        act(observer, _inciter(observer, "error", {error}));
        observer.errored = true;
        (_error || ((error) => {
            throw error;
        }))(error);
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
     * @returns {void}
     */
    function complete() {
        if (!observer.canCompute) return
        act(observer, _inciter(observer, "complete"));
        observer.completed = true;
        _complete?.();
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
     * @returns {void}
     */
    function next(value) {
        if (!observer.started && filters?.flat().includes("initial")) {
            act(observer, _inciter(observer, "initial"));
            observer.started = true;
        }
        act(observer, value);
    }

    /**
     * Convenience function for complete that helps interop with other observables types.
     * @memberOf Señal.tada
     * @instance
     */
    function unsubscribe() {
        observer.complete();
    }
}

export {tada};