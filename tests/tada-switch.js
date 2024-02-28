import {test, skip, solo} from "brittle";
import {senal} from "../lib/senal.js";
import {tada} from "../lib/tada.js";
import {inciter} from "../lib/inciter.js";

test("Simple switch", t => {
    const s = senal({on: true});
    const results = [];
    const ta = tada((i) => {
        if (s.x || i.reason === "property") {
            results[results.length] = s.x;
        }
    })
        .addFilter({on: s})
        .completeNextTick();

    s.x = "hello";
    s.on = false;
    s.x = "its not on";
    s.x = "I'm talking to myself.";
    s.on = true;
    s.x = "world";
    t.is(results.join(" "), "hello world");
});

test("complex switch", t => {
    const s1 = senal({on: true});
    const s2 = senal({on: true});
    const s3 = senal({on: false});

    const ta = tada((i) => {
            if (i.beep === "boop") {
                t.pass("The robots invaded.");
            } else {
                t.is(i.value, "this works", `the switches are on ${s1.on} ${s2.on} ${s3.on}`);
            }
        },
        // These are really shorthands to functions that could dereference
        {on: s1},
        {on: s2},
        // You could do this also if you need to do something like a negation.
        () => !!s3.on,
        "manual"
    ).completeNextTick();

    ta.next("this doesn't work");
    s3.on = true;
    ta.next("this works");
    s2.on = false;
    ta.next("this doesn't work");
    s1.on = false;
    ta.next("this doesn't work");
    s1.on = s2.on = s3.on = true;
    ta.next("this works");
    // Add the switch filter that resolves to a reason, but s1 doesn't have
    // r2d2 reason yet, so....
    ta.addFilter({robot: s1});
    const r2d2 = inciter("robot", "r2d2", {beep: "boop"});
    ta.next(r2d2); // ... this won't work until r2d2 is set on s1.robot
    s1.robot = "r2d2";
    ta.next(r2d2);
    ta.next("this works");
});

test("Creating a senal with a property of it self, you can just pass into the object/switch the senal", t => {
    const on = senal({on: false, times: 0});
    const ta = tada(
        i => {
            if (i.reason === "manual") on.times++;
        }
    ).addFilter({on}).completeNextTick();
    t.is(on.times, 0, "Switch is off");
    on.on = true;
    ta.next();
    ta.next();
    t.is(on.times, 2, "Switch is on so let us incremented twice.");
    on.on = false;
    ta.next();
    ta.next();
    t.is(on.times, 2, "Switch is off");
});