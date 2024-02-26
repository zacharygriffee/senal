import {tadaSymbol, instigatorSymbol} from "./symbols.js";
import {_inciter} from "./inciter.js";
import {passFilter} from "./passFilter.js";
import Q from "./utils/queue.js";
const {push, pop, clear} = new Q();

let currentTada = undefined;
let lock = false;

function act(observer, instigator) {
    observer = observer[tadaSymbol];
    if (!observer.canCompute || observer.inQueue) return;
    push(observer, (a, b) => a.id === b.id);
    observer.inQueue = true;
    if (!instigator?.[instigatorSymbol]) {
        instigator = _inciter(observer, "manual", instigator)
    }
    if (!lock) {
        lock = true;
        let cursor;
        while (cursor = pop()) {
            if (!cursor.canCompute) continue;

            if (passFilter(cursor, instigator)) {
                currentTada = cursor;
                try {
                    (cursor._next || cursor.next)(instigator);
                } catch (e) {
                    e.instigator = instigator;
                    cursor.error(e);
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