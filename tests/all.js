import {skip, solo, test} from "brittle";
import {tada, senal, inciter} from "../index.js";
import {currentInciter, currentTada, invalidateCurrent, setCurrentWhile} from "../lib/act.js";

await import("./senal.js");
await import("./tada.js");
await import("./tada-reasons.js");
await import("./tada-switch.js");
await import("./invocation.js");
await import("./tada-position-sensitive.js");
await import("./inciter.js");
await import("./collection.js");
await import("./pause.js");
await import("./ignore.js");
await import("./rxjs-interop.js");

// MISC tests.

test("senal example", async t => {
    const obj = senal({x: 5});
    let x;
    tada(() => x = obj.x * 5);
    t.is(x, 25);
    obj.x = 10;
    t.is(x, 50);
});

test("act invalidate current", (t) => {
    const ta = tada(() => {});
    const inc = inciter("any", "reason");
    setCurrentWhile(ta, inc, () => {
        t.is(currentTada.id, ta.id);
        t.is(currentInciter.id, inc.id);
        invalidateCurrent();
        t.absent(currentTada);
        t.absent(currentInciter);
    });
});