import {isFunction} from "./isFunction.js";

export function isObserver(observer) {
    return [observer?.next, observer?.error, observer?.complete].some(isFunction);
}