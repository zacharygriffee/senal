import {test, skip, solo} from "brittle";
import {senal} from "../lib/senal.js";
import {tada} from "../lib/tada.js";

test("tada 'initial' reason only", t => {
    t.plan(3);
    const s = senal({prop1: 10});
    const ta = tada((i) => {
        t.is(i.reason, "initial");
        t.pass("This tada should only occur once with the 'initial' reason.");
        s.prop1;
        s.prop1 += 4;
    }, "initial");

    ta.next();
    s.prop2 = 5;
    s.prop2 = {};

    t.is(s.prop1, 14, "the initial reason will set the variables only once.");
    ta.complete();
});

test("If initial reason is set after tada creation and tada hasn't started yet, the initial incite will still occur", t => {
    let times = 0;
    const ta = tada(i => {
        t.ok(i.reason === "initial" || i.reason === "manual", i.reason + " reason incited");
        if (i.reason === "manual") {
            t.is(i.value, "hello there", "the value exists on manual incite");
        }
        times++;
    }, "manual");
    ta.addFilter("initial");
    ta.next("hello there");
    ta.complete();
    t.is(times, 2, "Runs twice because initial and manual runs.");
});

test("todo 'manual' only", t => {
    let times = 0;
    const s = senal();
    const ta = tada(i => {
        t.ok(i.reason, "manual");
        t.ok(i.value, "hello there");
        s.prop1;
        times++;
    }, "manual");

    ta.next("hello there");
    s.prop1 = 5;
    ta.complete();
    t.is(times, 1, "runs once.");
});


test("todo 'collection' only", t => {
    let times = 0;
    let x;
    const s = senal();
    const ta = tada((i) => {
        t.is(i.reason, "collection");
        s.prop1;
        s.prop1 = 4;
        // Even though subscribeOnSet is not true on the senal regarding s.prop2, collection will collect this anyway.
        s.prop2 = 5;
        times++;
        x = "hello";
    }, "collection");

    const inciters = [...ta];
    t.is(times, 1, "tada should only run once during collection");
    t.is(inciters.length, 3, "a total of 3");
    t.absent(s.prop1, "tada is readOnly so any senal setters won't set.");
    t.absent(s.prop2, "tada is readOnly so any senal setters won't set.");

    const getters = inciters.filter(o => o.type === "get");
    const setters = inciters.filter(o => o.type === "set");

    t.is(getters.length, 1);
    t.is(setters.length, 2);

    t.is(x, "hello", "side effects still occur");
    ta.complete();
    t.ok(ta.completed);
});

test("todo 'complete' only... with function", t => {
    let times = 0;
    const s = senal();
    const ta = tada(i => {
        t.ok(i.reason, "complete");
        s.prop1;
        times++;
    }, "complete");

    ta.next("hello there");
    s.prop1 = 5;
    ta.complete();
    t.is(times, 1, "runs once.");
    t.ok(ta.completed);
});

test("todo 'complete' only... with observer interface", t => {
    const completeIncited = t.test("complete interface function incited");
    completeIncited.plan(1);
    let times = 0;
    const s = senal();
    const ta = tada({
        next(i) {
            t.ok(i.reason, "complete");
            s.prop1;
            times++;
        },
        complete() {
            completeIncited.pass();
        }
    }, "complete");

    ta.next("hello there");
    s.prop1 = 5;
    ta.complete();
    t.is(times, 1, "runs once.");
    t.ok(ta.completed);
});

test("todo 'error' only... with function and try catch", t => {
    let times = 0;
    let ta;
    const s = senal();
    try {
        ta = tada(
            (i) => {
                t.is(i.reason, "error", "If reason exists in filters, errors will incite the tada one last time...");
                t.is(i.error.message, "some error", "... with inciter.error with the error that occurred...");
                t.ok(i.error instanceof Error, "... once the error occurs nothing more can be done with the tada.");
                s.prop1;
                times++;
            }, "error"
        );

        ta.next("hello there");
        s.prop1 = 5;
        ta.error(new Error("some error"));
    } catch (e) {
        t.is(e.message, "some error", "the try catch will be triggered to handle the error.");
    }
    ta.error(new Error("another error but won't incite cause it already errored."));
    ta.complete(); // Won't incite.
    t.is(times, 1, "runs once.");
    t.ok(ta.errored);
});

test("todo 'error' only... with observer interface", t => {
    let times = 0;
    const s = senal();
    const ta = tada({
        next(i) {
            t.is(i.reason, "error", "If reason exists in filters, errors will incite the tada one last time...");
            t.is(i.error.message, "some error", "... with inciter.error with the error that occurred...");
            t.ok(i.error instanceof Error, "... once the error occurs nothing more can be done with the tada.");
            s.prop1;
            times++;
        },
        error(e) {
            t.is(e.message, "some error", "the observer.error function will handle errors.");
        }
    }, "error");

    ta.next("hello there");
    s.prop1 = 5;
    ta.error(new Error("some error"));
    ta.error(new Error("another error but won't incite cause it already errored."));
    ta.complete(); // Won't incite.
    t.is(times, 1, "runs once.");
    t.ok(ta.errored);
});

