import {tadaSymbol} from "./symbols.js";

/**
 * Pause a computed observer.
 * @example
 * const fn = () => x += 5;
 * tada(fn);
 * // Things will react here
 * const resume1 = pause(fn);
 * const resume2 = pause(fn);
 * // this observer will not react here
 * resume1();
 * // things still won't react
 * resume1();
 * // nope
 * resume2();
 * // things will be reactive again.
 *
 *
 * @param {(object|function)} observer The observer or function used in the computed.
 * @returns {function} resume A function that will only resume this pause. To resume a pause, it must be produced by
 * the pause that caused it.
 * @memberOf Señal
 */
function pause(observer) {
    const reveal = observer?.[tadaSymbol];
    if (reveal) {
        reveal.paused++;
        return resume.bind({done: false}, reveal);
    }
}

function resume(observer) {
    if (this.done) return;
    observer.paused = Math.max(observer.paused - 1, 0);
    this.done = true;
}

export {pause};