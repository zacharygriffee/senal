export function observerCompletedOrErrored(observer) {
    return observer && (observer.completed || observer.errored);
}