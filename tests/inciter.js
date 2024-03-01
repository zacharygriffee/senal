// noinspection JSConstantReassignment

import {solo, skip, test} from "brittle";
import {inciter} from "../lib/inciter.js";
import {tada} from "../lib/tada.js";

const isStrictMode = (() => !this)();

test("Once a custom inciter is created it cannot be modified if javascript strict mode is true. " +
    "If not in strict mode, it will silently fail so this test will fail.",
    {skip: !isStrictMode},
    async t => {
        const deepThought = inciter({}, "deepThought", {
            theAnswer: 42
        });

        t.exception.all(() => {
            deepThought.cause = "no cant do this";
        });

        t.exception.all(() => {
            deepThought.meta = "wooo";
        });

        const observer = tada((inciter) => {
            t.exception.all(() => {
                return inciter.theAnswer = 24;
            }, inciter.reason + " inciter cannot be modified or changed.");
        }, "deepThought", "manual")
            .next(deepThought)
            .next()
            .complete();

        t.ok(observer.completed);
    }
);

test("reason must be a string", t => {
    [null, undefined, {hello: "world"}, 42, () => false].forEach(
        (s) => t.exception(inciter.bind(null, "cause", s))
    )
});


test("reserved reasons that cannot be used in custom inciters", t => {
    ["initial", "invocation", "complete", "manual", "error", "property", "collection"].forEach(
        s => t.exception(inciter.bind(null, "cause", s))
    )
})