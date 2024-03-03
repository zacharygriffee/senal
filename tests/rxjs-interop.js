import {test, solo} from "brittle";
import * as rxjs from "rxjs";
import * as rxjsOperators from "rxjs/operators";
import {tada} from "../lib/tada.js";
import {senal} from "../lib/senal.js";
import {inciter} from "../lib/inciter.js";

const rx = {...rxjsOperators, ...rxjs};

test("rxjs.from of a tada with operators", async t => {
    const s = senal();
    const ta = tada(() => {
        s.x;
        s.y;
    });

    rx.from(
        ta
    ).subscribe(
        op => {
            s.y = 5;
            s.x = 5;
        }
    );
    s.y = 20;
    s.x = 20;
    t.is(s.y, 5);
    t.is(s.x, 5);
});

test("rxjs.from multiple subscribers, one unsubscribes", async t => {
    t.plan(2);
    const inc = inciter("test", "test");
    const ta = tada(() => {
    }, "test");

    rx.from(ta).subscribe({
        next: () => {
            t.pass();
        },
        complete: () => {
            t.pass();
        }
    });
    rx.from(ta)
        .subscribe({
            next: () => {
                t.fail();
            },
            complete: () => {
                // rxjs unsubscribe doesn't call complete.
                t.fail();
            }
        })
        .unsubscribe();

    ta.next(inc);
    ta.complete();
});

test("tada error propagates to subscribers and only triggers once.", async t => {
    t.plan(2);
    const ta = tada(() => {
    });

    rx.from(ta).subscribe({
        next() {
            t.fail()
        },
        complete() {
            t.fail();
        },
        error(e) {
            t.is(e.message, "hot dog");
        }
    });

    ta.error(new Error("hot dog"));
    ta.error(new Error("hot dog"));

    t.ok(ta.errored);
});

test("tada complete propagates to subscribers and only triggers once.", async t => {
    t.plan(2);
    const ta = tada(() => {
    });

    rx.from(ta).subscribe({
        next() {
            t.fail()
        },
        error() {
            t.fail();
        },
        complete() {
            t.pass();
        }
    });

    ta.complete();
    ta.complete();

    t.ok(ta.completed);
});

test("You don't need RXJS to subscribe. But you need rxjs for their utilities like pipe. Multiple subscribers complete triggers each subscriber once", async t => {
    t.plan(3);
    const ta = tada(() => {
    });
    ta.subscribe({
        next() {
            t.fail();
        },
        error() {
            t.fail();
        },
        complete() {
            t.pass();
        }
    });

    ta.subscribe({
        next() {
            t.fail();
        },
        error() {
            t.fail();
        },
        complete() {
            t.pass();
        }
    });

    ta.complete();
    ta.complete();

    t.ok(ta.completed);
});

test("Multiple subscribers error triggers each subscriber once", async t => {
    t.plan(3);
    const ta = tada(() => {
    });
    rx.from(ta).subscribe({
        next() {
            t.fail();
        },
        error() {
            t.pass();
        },
        complete() {
            t.fail();
        }
    });

    rx.from(ta).subscribe({
        next() {
            t.fail();
        },
        error() {
            t.pass();
        },
        complete() {
            t.fail();
        }
    });

    ta.error(new Error());
    ta.error(new Error());

    t.ok(ta.errored);
});

test("rxjs to tada", async t => {
    const inc = inciter("fun", "test");
    const s = senal();
    rx.of(inc).subscribe(
        tada((i) => {
            if (i.reason === "test") {
                t.is(i.cause, "fun");
            }

            if (s.x && i.reason === "property") {
                t.is(s.x, 5);
            }
        }, "test", "property").completeNextTick()
    );

    s.x = 5;
});

test("rxjs to errored tada", async t => {
    const inc = inciter("fun", "test");
    const ta = tada({
        next: () => {
            t.fail();
        },
        error: () => {
            t.pass();
        },
        complete: () => {
            t.fail();
        }
    }, "test");

    ta.error();
    t.is(rx.of(inc).subscribe(ta).closed, true);
});

test("rxjs to completed tada", async t => {
    const inc = inciter("fun", "test");
    const ta = tada({
        next: () => {
            t.fail();
        },
        error: () => {
            t.fail();
        },
        complete: () => {
            t.pass();
        }
    }, "test");

    ta.complete();
    t.is(rx.of(inc).subscribe(ta).closed, true);
});

test("tada to rxjs to tada", t => {
    const inc = inciter("fun", "test", "world");
    const ta1 = tada((i) => {
        t.is(i.reason, "test");
        t.is(i.value, "world");
    }, "test");

    const ta2 = tada((i) => {
        t.is(i.reason, "test");
        t.is(i.value, "HELLO");
    }, "test");

    rx.from(ta1).pipe(
        rx.map(o => {
            return {...o, value: "HELLO"}
        })
    ).subscribe(o =>
        ta2.next(o)
    );

    ta1.next(inc);
});

test("Unsubscribe of tada, unsubscribes from all subscriptions", t => {
    const ta = tada(undefined, "manual");
    ta.subscribe(() => t.fail());
    ta.unsubscribe();
    ta.next("doesn't happen");
    t.alike(ta._subscriptions, {});
    t.is(ta.completed, true);
});