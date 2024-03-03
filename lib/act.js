import {inciterSymbol, invoker, tadaSymbol} from "./symbols.js";
import {_inciter} from "./inciter.js";
import {passFilter} from "./passFilter.js";
import Q from "./utils/queue.js";
import {observerCompletedOrErrored} from "./utils/observerCompletedOrErrored.js";

const {push, pop, clear} = new Q();
let currentTada = undefined;
let currentInciter = undefined;
let lock = false;

function setCurrentWhile(tada, inciter, cb) {
    let oldTada = currentTada, oldInciter = currentInciter;
    currentTada = tada;
    currentInciter = inciter;
    cb();
    currentTada = oldTada;
    currentInciter = oldInciter;
}

function setCurrent(tada, inciter) {
    currentTada = tada;
    currentInciter = inciter;
}

function invalidateCurrent() {
    currentTada = undefined;
    currentInciter = undefined;
}

/**
 * An inciter is the why/how, the observer is the who
 * @private
 * @param inciter What will incite the observer
 * @param observer the observer that will be incited
 */
function act(inciter, observer) {
    observer = observer[tadaSymbol];
    if (observerCompletedOrErrored(observer) || observer.paused || observer.inQueue) {
        return;
    }

    if (!inciter?.[inciterSymbol]) {
        inciter = _inciter(observer, "manual", inciter)
    }
    inciter = Object.freeze(inciter);
    push({observer, inciter}, (a, b) => a.observer.id === b.observer.id && a.inciter.id === b.inciter.id);
    observer.inQueue = true;

    if (!lock) {
        lock = true;
        let cursor;
        while (cursor = pop()) {
            const {observer, inciter} = cursor;
            if (passFilter(observer, inciter)) {
                if (observerCompletedOrErrored(observer) || observer.paused) continue;
                // Don't think there is any reason for this to be here, but
                // leaving it for safety.
                if (observerCompletedOrErrored(observer) || observer.paused)
                    break;
                currentInciter = inciter;
                currentTada = observer;
                try {
                    currentInciter[invoker](observer._next)
                    observer._next(inciter);
                    for (const sym of Object.getOwnPropertySymbols(currentTada._subscriptions)) {
                        const subscriber = currentTada._subscriptions[sym]
                        subscriber.next(inciter);
                    }
                } catch (e) {
                    // Run next queue.
                    lock = false;
                    // Clear the queue as this queue shouldn't run anymore.
                    clear();
                    e.inciter = inciter;
                    observer.error(e);
                    // Just to make sure.
                    break;
                } finally {
                    currentInciter[invoker](null);
                    currentInciter = undefined;
                    currentTada = undefined;
                }
            }
            observer.inQueue = false;
        }
        lock = false;
        clear();
    }
}

export {act};
export {
    currentTada,
    currentInciter,
    setCurrentWhile,
    setCurrent,
    invalidateCurrent
};