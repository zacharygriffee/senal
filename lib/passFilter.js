import {isFunction} from "./utils/index.js";
import {reactiveSymbol} from "./symbols.js";

export function passFilter(observer, inciter) {
    if (!!observer.filters?.length) {
        let pass = true;
        const filters = [...observer.filters.flat(Infinity)];
        for (const filter of filters) {
            if (!!filter && typeof filter === "object") {
                const reactives = Object.entries(filter).filter(([, o]) => !!o?.[reactiveSymbol]);
                for (let [key, reactive] of reactives) {
                    filters.push(reactive?.[key]);
                }
                continue;
            } else {
                if (filter === false || filter === true) {
                    if (!(pass = filter)) break;
                }
                else if (isFunction(filter))
                    if (!(pass = pass !== false && !!filter(inciter))) break;
            }
        }

        return pass && filters.filter(o => typeof o === "string").includes(inciter.reason);
    }
    return false;
}