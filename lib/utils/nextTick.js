let nextTick;
if (typeof queueMicrotask === "function") {
    nextTick = queueMicrotask;
    /* c8 ignore next 3 */
} else {
    nextTick = e => Promise.resolve().then(e);
}
export {nextTick};