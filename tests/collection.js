import {test, solo} from "brittle";
import {senal} from "../lib/senal.js";
import {collectBetween, collectLastTick, collectNextTick, collectNextTickLive} from "../lib/collector.js";

test("collection of the next tick, callback version", t => {
    t.plan(10);
    const s1 = senal();
    const s2 = senal();

    collectNextTick(doTest.bind(null, t));

    s1.x = 5;
    s1.y = 2;
    s2.x;
});

test("collection of the next tick, with thenable (because async await won't work)", t => {
    t.plan(10);
    const s1 = senal();
    const s2 = senal();

    collectNextTick().then(doTest.bind(null, t));

    s1.x = 5;
    s1.y = 2;
    s2.x;
});

test("collection between", t => {
    t.plan(10);
    const s1 = senal();
    const s2 = senal();
    const end = collectBetween();
    s1.x = 5;
    s1.y = 2;
    s2.x;
    doTest(t, end());
});

test("collection of last and current tick and being in order", t => {
    const s1 = senal();
    const s2 = senal();
    s1.x = 5;
    s1.y = 2;
    s2.x;

    doTest(t, collectLastTick());
});

test("collection of next tick live", t => {
    const s1 = senal();
    const s2 = senal();
    const arr = [];
    collectNextTickLive(instigator => {
        arr.push(instigator);
    });

    s1.x = 5;
    s1.y = 2;
    s2.x;

    doTest(t, arr);
});


function doTest(t, arr) {
    // Future concepts of senal will have other types of reactivity
    // future-proofing this test.
    arr = arr.filter(o => ["get", "set"].includes(o.type));
    const [first, second, third, fourth] = arr;
    const testArr = [
        {inciter: first, property: "x", type: "set", cause: first.cause},
        {inciter: second, property: "y", type: "set", cause: second.cause},
        {inciter: third, property: "x", type: "get", cause: third.cause}
    ];

    t.absent(fourth);

    for (const i in arr) {
        t.is(testArr[i].property, arr[i].property);
        t.is(testArr[i].type, arr[i].type);
        t.is(testArr[i].cause.x, arr[i].cause.x);
    }
}