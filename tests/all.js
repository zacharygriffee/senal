import {skip, test} from "brittle";
import {tada, senal, senal} from "../index.js";

test("observe example", async t => {
    const obj = senal({x: 5});
    let x;
    tada(() => x = obj.x * 5);
    t.is(x, 25);
    obj.x = 10;
    t.is(x, 50);
});

await import("./senals.js");
await import("./tada.js");
await import("./pause.js");
await import("./ignore.js");
await import("./dispose.js");