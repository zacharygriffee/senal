// noinspection JSConstantReassignment

import {solo, test} from "brittle";
import {inciter, setInciterSymbolMaker} from "../lib/inciter.js";
import {tada} from "../lib/tada.js";
import {senal} from "../lib/senal.js";

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
});

test("the inciter's surface is immutable, you cannot modify that. But, you can manipulate nested objects like the cause or added meta data.", t => {
    t.plan(6);
    const inc = inciter("fun", "test");
    const s = senal();

    tada(i => {
        t.exception.all(() => i.type = "something else", "modifying inciter will call a type error");
        t.exception.all(() => i.property = "some other property", "modifying inciter properties will call a type error");

        if (s.x > 4) {
            i.cause.x = 8;
            t.pass("But you can make changes to the inciter.cause and other nested objects an " +
                "inciter may have been declared with via meta argument.");
        }
    }, "test", "property").next(inc);

    s.x = 5;
    t.is(s.x, 8, "modification triggered by i.cause.x");
});

test("custom inciter symbol maker", t => {
    let id = "howAboutThat";
    let reason = "test";
    let addlArg = "someAdditional";

    let symbol1 = Symbol.for(id + reason + addlArg);
    setInciterSymbolMaker((any, reason, meta, addlArg) => {
        return Symbol.for((any?.id || typeof any) + reason + addlArg);
    });

    const inc = inciter({string: "fun", id}, "test", {}, addlArg);
    t.is(symbol1, inc.symbol);

    tada(i => {
        t.is(i.reason, "test");
    }, "test").next(inc).completeNextTick();

    setInciterSymbolMaker();
});