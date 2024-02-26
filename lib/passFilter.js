import {isFunction} from "./utils/index.js";

export function passFilter(observer, instigator) {
    let pass = !observer.filters?.length;
    if (!pass) {
        for (const filter of observer.filters) {
            if (typeof filter === "string" && instigator.reason === filter && pass === false) {
                pass = true;
                continue;
            } else {
                if (filter === false || filter === true)
                    if (!(pass = filter)) break;
                    else if (isFunction(filter))
                        if (!(pass = pass !== false && !!filter(instigator))) break;
            }
        }
    }
    return pass;
}