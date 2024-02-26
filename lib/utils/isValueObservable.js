export function isValueObservable(value) {
    return value != null && (typeof value === "object" || typeof value === "function")
}