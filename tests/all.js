import {skip, test} from "brittle";
import {tada, senal} from "../index.js";

test("observe example", async t => {
    const obj = senal({x: 5});
    let x;
    tada(() => x = obj.x * 5);
    t.is(x, 25);
    obj.x = 10;
    t.is(x, 50);
});

await import("./senal.js");
await import("./tada.js");
await import("./tada-reasons.js");
await import("./tada-switch.js");
await import("./collection.js");
await import("./pause.js");
await import("./ignore.js");
await import("./dispose.js");