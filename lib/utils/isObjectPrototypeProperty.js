const keys = Object.getOwnPropertyNames(Object.getPrototypeOf({}));
export function isObjectPrototypeProperty(property) {
    return keys.includes(property);
}