import {skip, test, solo} from "brittle";
import {senal} from "../lib/senal.js";
import {tada} from "../lib/tada.js";
import {nextTick} from "../lib/utils/nextTick.js";

test("Invokable senal. Intercept accept", t => {
    const invokableSenal = senal((firstname, lastname) => {
        return `${firstname} ${lastname}`;
    });

    tada(i => {
        // intercept a senal function ahead of the tada.
        if (i.reason === "invocation") {
            const {
                args: [firstname]
            } = i;
            if (firstname === "Zachary") {
                i.accept("Zack");
            }
        }
    }).intercept().completeNextTick();

    t.alike(invokableSenal("Zachary", "Griffee"), "Zack Griffee");
});


test("Invokable senal. Intercept shim", t => {
    const invokableSenal = senal((firstname, lastname) => {
        return `${firstname} ${lastname}`;
    });

    tada(i => {
        // intercept a senal function ahead of the tada.
        if (i.reason === "invocation") {
            const {
                args: [firstname]
            } = i;
            if (firstname === "Zachary") {
                i.shim("Zack");
            }
        }
    }).intercept().completeNextTick();

    t.alike(invokableSenal("Zachary", "Griffee"), "Zack");
});

test("Invokable senal. Intercept instead", t => {
    const invokableSenal = senal((firstname, lastname) => {
        return `${firstname} ${lastname}`;
    });

    tada(i => {
        // intercept a senal function ahead of the tada.
        if (i.reason === "invocation") {
            const {
                args: [firstname]
            } = i;
            if (firstname === "Zachary") {
                i.instead(anotherFunction);
            }
        }
    }).intercept().completeNextTick();

    function anotherFunction(fn, ln) {
        return `${ln}, ${fn}`;
    }

    t.alike(invokableSenal("Zachary", "Griffee"), "Griffee, Zachary");
});

test("Intercept a senal function from within tada", t => {
    const invokableSenal = senal((firstname, lastname) => {
        return `${firstname} ${lastname}`;
    });

    tada(i => {
        if (i.reason === "invocation") {
            i.shim("el señal")
        } else {
            t.is(invokableSenal("the signal"), "el señal");
            t.is(invokableSenal("the signal"), "el señal");
        }
    }).completeNextTick();
});

test("Invokable in tada will not invoke if inciter.reason === invocation", t => {
    const invokableSenal = senal((arg) => {
        return arg + "!!!"
    });

    /*
      -- the logic --

      1: Starts with initial inciter
      2: Invoke invokable senal
      3: -- hold `initial` inciter --
      4: -- tada incites with reason `invocation` --"
      5: invokableSenal does not reinvoke itself during reason `invocation`
         so it returns undefined during this step.
      6: determine how invokableSenal will be changed or keep it the same
      7: -- tada `invocation` is done --
      8: -- resume `initial` inciter reason --

     */

    const expected = [
        undefined,  // This occurs during reason invocation
        "the signal!!!" // This happens after reason invocation
    ];

    tada(() => {
        // We don't change anything so the invokable senal so it runs the way it was made ;).
        t.is(invokableSenal("the signal"), expected.shift());
    }).completeNextTick();
});

test("Invoke an invokable senal multiple times maintains order.", t => {
    let testResult = [];
    let testCase = [
        "hello",
        "world",
        "you",
        "rock"
    ];
    let count = 0;
    const invokableSenal = senal(arg => {
        testResult.push(arg);
    });

    tada((i) => {
        count++;
        // Side effects occur both initial reason and invocation reason
        // So you have to short circuit side effects like so.
        // Since the invokableSenal will not reinvoke itself during the invocation
        // phase, they won't be executed anyway but the side effect testCase.shift() will.
        invokableSenal(i.isInvocation || testCase.shift());
        invokableSenal(i.isInvocation || testCase.shift());
        invokableSenal(i.isInvocation || testCase.shift());
        invokableSenal(i.isInvocation || testCase.shift());
    }).completeNextTick();

    t.alike(testResult, [
        "hello",
        "world",
        "you",
        "rock"
    ]);

    t.is(count, 5, "runs 5 times... the initial, and the four invocations");
});

test("Invoke an invokable senal multiple times maintains order with a while loop.", t => {
    let testResult = [];
    let testCase = [
        "hello",
        "world",
        "you",
        "rock"
    ];
    const invokableSenal = senal(arg => {
        testResult.push(arg);
    });
    let count = 0;
    tada((i) => {
        count++;
        // short circuit a while or loop
        // otherwise the while loop and the testCase.shift
        // will run on both the initial and invocation
        if (i.isInvocation) {
            const [firstArg] = i.args;
            i.accept(firstArg.toUpperCase());
            return;
        }
        let str;

        while (str = testCase.shift())
            invokableSenal(str);
    }).completeNextTick();

    t.alike(testResult, [
        "HELLO",
        "WORLD",
        "YOU",
        "ROCK"
    ]);

    t.is(count, 5, "runs 5 times... the initial, and the four invocations");
});

test("Multiple invokable senals in tada", t => {
    const testResult1 = [];
    const testResult2 = [];

    const invokableSenal1 = senal(arg => {
        testResult1.push(arg);
    });
    const invokableSenal2 = senal(arg => {
        testResult2.push(arg);
    });
    let count = 0;
    let lineNumbers = [];
    tada({
        next(i) {
            count++;
            if (i.isInvocation) {
                lineNumbers.push({
                    cause: i.cause,
                    line: i.line
                });
                return;
            }
            // Senals are not invoked during THEIR OWN
            // invocation. So multiple invokable senals can
            // cause the other invocation to invoke during invocation.
            invokableSenal2("I'm not the one");
            invokableSenal1("I'm the one");
        },
        complete() {
            lineNumbers.sort((a, b) => a.line > b.line)[0].cause("But I'm the first to be invoked.");
        }
    }).complete();

    t.alike(testResult1, ["I'm the one"]);
    t.alike(testResult2, ["I'm not the one", "But I'm the first to be invoked."]);
    t.is(count, 3, "initial, and two invocations");
});

test("Async invokable senal will not cause 'invocation'. This behavior may change in future.", t => {
    t.plan(2)
    const invokableSenal1 = senal(arg => {
        t.is(arg, "I am the one");
    });
    let count = 0;
    const ta = tada(async (i) => {
        count++;
        if (i.isInvocation) {
            t.fail();
            return;
        }
        await new Promise(nextTick);
        invokableSenal1("I am the one");
        t.is(count, 1);
        ta.complete();
    });
});

test("Invokable inside regular senal object and checking function name with inciter.property", t => {
    const s = senal({
        toUpperCase: (x) => {
            return x.toUpperCase()
        },
        x: 5
    });

    tada({
        next(i) {
            // i.property for invokable all depends on how the function is defined
            // and what your minification settings are.
            // if the function has a name like in the object above,
            // you are safe to use it
            // But if you use function name() {} minification
            // may mangle the "name" and you can't depend on that
            // to filter out what was caused.
            // as well... property can catch both property accesses and
            // invocations.
            if (i.property === "toUpperCase" && i.isInvocation) {
                const [firstArg] = i.args;
                i.accept(firstArg.replace("small", "big"));
                t.pass();
                return;
            } else if (i.property === "toUpperCase" && !i.isInvocation) {
                // The actual function property is also reactive.
                // and you can prevent reassignment with this.
                s.toUpperCase = i.prevValue;
                // Just to prove we were here.
                s.x = 20;
                return;
            } else if (s.x && i.property === "x") {
                s.x = 3;
                return;
            }
            // s.x is dereferenced here before the s.x = 10 reaction occurs below.
            t.is(s.toUpperCase("I am small " + s.x), "I AM BIG 5");
        }
    }).completeNextTick();

    s.x = 10;
    t.is(s.x, 3);
    s.toUpperCase = "hello";
    t.is(s.x, 20);
});

test("Invoking another invokable senal during reason `invocation` currently not supported (and I can't think of a use atm).", t => {
    const testResult1 = [];
    const testResult2 = [];

    const invokableSenal1 = senal(
        function one(arg) {
            testResult1.push(arg);
        }
    );
    const invokableSenal2 = senal(
        function two(arg) {
            testResult2.push(arg);
        }
    );

    tada({
        next(i) {
            if (i.property === "two") {
                t.fail();
            }
            if (i.property === "one") {
                invokableSenal2("two");
                return;
            }
            invokableSenal1("step 1");
        }
    }).completeNextTick();

    t.alike(testResult1, ["step 1"]);
    t.alike(testResult2, ["two"]);
});



