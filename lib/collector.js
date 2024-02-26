import {tadaSymbol} from "./symbols.js";
import {_inciter} from "./inciter.js";

let collector;

export function collect(computedObserver) {
    const observer = computedObserver[tadaSymbol];
    let initialReadonly = observer.readOnly;
    try {
        collector = [];
        observer.readOnly = true;
        const instigator = _inciter(
            observer, "collection"
        );
        observer.next(
            instigator
        );
        observer.readOnly = initialReadonly;
        return [...collector]
    } finally {
        collector = [];
    }
}

export function addToCollector(instigator) {
    if (Array.isArray(collector)) {
        collector.push(instigator);
    }
}