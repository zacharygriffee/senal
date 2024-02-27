export function uniqueWith(arr, fn) {
    return arr.filter((element, index) => arr.findIndex((step) => fn(element, step)) === index);
}