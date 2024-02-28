import {tadaSymbol, inciterSymbol} from "./symbols.js";
import {_inciter} from "./inciter.js";
import {passFilter} from "./passFilter.js";
import Q from "./utils/queue.js";
import {observerCompletedOrErrored} from "./utils/observerCompletedOrErrored.js";
const {push, pop, clear} = new Q();
let currentTada = undefined;
let lock = false;

function act(observer, inciter) {
    observer = observer[tadaSymbol];
    if (observerCompletedOrErrored(observer) || observer.paused || observer.inQueue) return;
    push(observer, (a, b) => a.id === b.id);
    observer.inQueue = true;
    if (!inciter?.[inciterSymbol]) {
        inciter = _inciter(observer, "manual", inciter)
    }
    inciter = Object.freeze(inciter);
    if (!lock) {
        lock = true;
        let cursor;
        while (cursor = pop()) {
            if (passFilter(cursor, inciter)) {
                if (observerCompletedOrErrored(cursor) || cursor.paused) continue;
                // Don't think there is any reason for this to be here, but
                // leaving it for safety.
                if (observerCompletedOrErrored(observer) || observer.paused)
                    break;
                currentTada = cursor;
                try {
                    (cursor._next || cursor.next)(inciter);
                } catch (e) {
                    // Run next queue.
                    lock = false;
                    // Clear the queue as this queue shouldn't run anymore.
                    clear();
                    e.inciter = inciter;
                    cursor.error(e);
                    // Just to make sure.
                    break;
                }
                currentTada = undefined;
            }
            cursor.inQueue = false;
        }
        lock = false;
        clear();
    }
}

export {act};
export {currentTada};