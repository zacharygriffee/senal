export function observerCompletedOrErrored(observer) {
    return observer.completed || observer.errored;
}