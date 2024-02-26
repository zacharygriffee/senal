import {nonObjects} from "./nonObjects.js";

export const nonFunctions = [
    ...nonObjects,
    {}, {x: 10, y: true}, {
        obj: {
            hello() {
            }
        }, goodbye() {
        }
    },
    new Date(), new RegExp('test'), new Map()
];