import {test} from "brittle";
import {senal} from "../lib/senal.js";
import {tada} from "../lib/tada.js"

test("senal does not observe nested objects.", async t => {
    let obj = {num: 5, nested: {num: 10}};
    let x, y;
    const obs = senal(obj);

    tada(() => x = obs.nested.num);
    tada(() => y = obs.num);
    obs.nested.num = 2;

    t.is(x, 10);
    obs.num = 20;

    t.is(y, 20);
});