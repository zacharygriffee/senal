import {tadaSymbol} from "./symbols.js";
import {_inciter} from "./inciter.js";
import {uniqueWith} from "./utils/uniqueWith.js";
import {nextTick} from "./utils/nextTick.js";

let collector = [];
let lastTick = [];
let collections = new Map();
export function collectLastTick() {
    try {
        return [...uniqueWith(lastTick, (inca, incb) => inca.symbol === incb.symbol)];
    } finally {
        collector = [];
        lastTick = [];
    }
}

export function collect(tadaObserver, unique = true) {
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
        if (unique) collector = uniqueWith(collector, (inca, incb) => inca.symbol === incb.symbol);
        return [...collector]
    } finally {
        collector = [];
    }
}

export function collectBetween() {
    const sym = Symbol();
    collections.set(sym, []);
    return () => {
        try {
            return uniqueWith(collections.get(sym), (inca, incb) => inca.symbol === incb.symbol);
        } finally {
            collections.delete(sym);
        }
    }
}

export function collectNextTick(callback) {
    const sym = Symbol();
    collections.set(sym, []);
    return new Promise((resolve) => {
        nextTick(() => {
            let val = collections.get(sym);
            val = uniqueWith(val, (inca, incb) => inca.symbol === incb.symbol);
            callback?.(val);
            resolve(val);
            collections.delete(sym);
        })
    })
}

export function collectNextTickLive(callback) {
    const sym = Symbol();
    const already = [];
    collections.set(sym, (it) => {
        for (const x of it) {
            if (already.find(sym => sym === x.symbol)) continue;
            already.push(x.symbol);
            callback(x);
        }
    });
    nextTick(() => collections.delete(sym));
}

export function addToCollector(inciter) {
    lastTick.length = 0;
    collector.push(inciter);
    // Ensure no duplicate inciters occur.
    collector = uniqueWith(collector, (inca, incb) => inca.symbol === incb.symbol);
    lastTick = [...collector, ...lastTick];

    if (collections.size > 0)
        for (let col of collections.values()) {
            if (typeof col === "function") {
                col(collector)
            } else {
                col.push(...collector);
            }
        }

    nextTick(() => {
        collector.length = 0;
    });
}