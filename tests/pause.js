import {test, solo} from "brittle";
import {senal} from "../lib/senal.js";
import {tada} from "../lib/tada.js";
import {pause} from "../lib/pause.js";

test("Pause a computed", async t => {
    const obs = senal({adder: 5});
    let x = 0;
    const test = tada(() => x += obs.adder);

    obs.adder = 5;
    const resume = pause(test);
    obs.adder = 20;
    t.is(x, 10, "Pause will disable notification until resumed");
    resume();
    obs.adder = 5;
    t.is(x, 15, "After resume, things are back to working.");

    const r1 = pause(test);
    const r2 = pause(test);

    obs.adder = 5;
    t.is(x, 15, "multpile pauses can be called, all of the resumes must be called in order to resume the notifications.");

    r1();
    obs.adder = 5;
    t.is(x, 15);

    for (let i = 0; i < 5; i++) {
        r1();
        obs.adder = 5;
    }

    t.is(x, 15, "Multiple calls to the resume function will only resume for that pause function.");

    r2();
    obs.adder = 5;
    t.is(x, 20);
});