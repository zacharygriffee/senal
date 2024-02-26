import {solo, skip, test} from "brittle";
import {inciter} from "../lib/inciter.js";
import {tada} from "../lib/tada.js";

const isStrictMode = (() => !this)();

test("Once a custom inciter is created it cannot be modified if javascript strict mode is true.",
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
