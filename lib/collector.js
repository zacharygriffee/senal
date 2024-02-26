import {tadaSymbol} from "./symbols.js";
import {_inciter} from "./inciter.js";

let collector;

export function collect(tadaObserver) {
    const observer = tadaObserver[tadaSymbol];
    let initialReadonly = observer.readOnly;
    try {
        collector = [];
        observer.readOnly = true;
        const inciter = _inciter(
            observer, "collection"
        );
        observer.next(
            inciter
        );
        observer.readOnly = initialReadonly;
        return [...collector]
    } finally {
        collector = [];
    }
}

export function addToCollector(inciter) {
    if (Array.isArray(collector)) {
        collector.push(inciter);
    }
}