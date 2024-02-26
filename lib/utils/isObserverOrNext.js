import {isFunction} from "./isFunction.js";
import {isObserver} from "./isObserver.js";

export function isObserverOrNext(observer) {
    return isFunction(observer) ? true : isObserver(observer);
}