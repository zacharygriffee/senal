import {skip, test, solo} from "brittle";
import {senal} from "../lib/senal.js";
import {tada} from "../lib/tada.js";

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
    })
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
    })
});