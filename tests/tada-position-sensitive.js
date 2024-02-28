import {test} from "brittle";
import {tada} from "../lib/tada.js";





/// POSITION SENSITIVE TESTS
// DO NOT MOVE THEM. WHITESPACE ABOVE LEFT ON PURPOSE

test("Throw an error in a tada,", t => {
    function aFunctionThatCallsTada() {
        let ta;
        try {
            ta = tada(() => {
                throw new Error("hello");
            }, "initial");
        } catch (e) {
            t.is(e.inciter.reason, "initial", `the inciter is injected into the error...`);
            t.is(e.inciter.line, 25, "Gives the line number of the error of the inciter (tada)");
            t.is(e.inciter.column, 5, "Gives the column number of error of the inciter (tada).");
            t.ok(!ta, "If error occurred on the initial run, it will not be declared.");
        }
    }
    aFunctionThatCallsTada();
});