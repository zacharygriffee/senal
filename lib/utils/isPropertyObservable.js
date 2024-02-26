export function isPropertyObservable(object, key) {
    if (object[key] == null) return true;
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    return key !== "__proto__" &&
        ({}).hasOwnProperty.call(object, key) &&
        descriptor.configurable &&
        descriptor.enumerable;
}