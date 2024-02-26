import {test, solo} from "brittle";
import {senals} from "../lib/senals.js";
import {tada} from "../lib/tada.js";
import {dispose} from "../lib/dispose.js";

test('Dispose removes all the dependencies from a tada function', (t) => {
    const numberCopier = senals({
        in: 0,
        out: 0
    });
    const numberCopierComputer = tada(() => {
        numberCopier.out = numberCopier.in;
    });

    t.is(numberCopier.out, 0);
    numberCopier.in = 10;
    t.is(numberCopier.out, 10);
    dispose(numberCopierComputer);
    numberCopier.in = 20;
    t.is(numberCopier.out, 10);
});

test('Dispose disposes and returns its first argument', (t) => {
    const counter = senals({
        value: 0,
        times: 0
    });
    tada(dispose(() => { // Does nothing, as tada ignores disposed funcs
        counter.value;
        counter.times++;
    }));

    t.is(counter.times, 0);
    counter.value++;
    t.is(counter.times, 0);
});


test('Dispose called without an argument uses the current tada function', (t) => {
    const countToFour = senals({
        number: 0
    });

    function countByOne() {
        countToFour.number++;
        if (countToFour.number === 4)
            dispose();
    }

    t.is(countToFour.number, 0);
    tada(countByOne);
    t.is(countToFour.number, 1);
    tada(countByOne);
    t.is(countToFour.number, 2);
    tada(countByOne);
    t.is(countToFour.number, 3);
    tada(countByOne);
    t.is(countToFour.number, 4);
    tada(countByOne); // No longer reactive
    t.is(countToFour.number, 4);
});

test('Disposing a tada function that was notified will cause it to be removed from the queue', (t) => {
    const power = senals({in: 0, pow2: 0, pow4: 0});

    function pow2() {
        power.pow2 = power.in ** 2;
        if (power.pow2 >= 64) dispose(pow4);
    }

    function pow4() {
        power.pow4 = power.pow2 ** 2;
    }

    tada(pow2);
    tada(pow4);

    t.alike(power, {in: 0, pow2: 0, pow4: 0});
    power.in = 4;
    t.alike(power, {in: 4, pow2: 16, pow4: 256});
    power.in = 6;
    t.alike(power, {in: 6, pow2: 36, pow4: 1296});
    power.in = 8;
    t.alike(power, {in: 8, pow2: 64, pow4: 1296});
    power.in = 6;
    t.alike(power, {in: 6, pow2: 36, pow4: 1296});
});


test('Dispose fails if passed no arguments while no tada function is executing', (t) => {
    t.exception(() => dispose());
});


test('Dispose returns its first argument', (t) => {
    function func() {
    }

    t.alike(dispose(func), func);
    t.alike(dispose(dispose(func)), func);
});

test('Dispose returns nothing if called without a valid first argument', (t) => {
    tada(() => {
        t.absent(dispose());
        t.absent(dispose(null));
        t.absent(dispose(undefined));
        t.absent(dispose(null, null));
        t.absent(dispose(null, undefined));
        t.absent(dispose(null, false));
        t.absent(dispose(null, true));
        t.absent(dispose(undefined, null));
        t.absent(dispose(undefined, undefined));
        t.absent(dispose(undefined, false));
        t.absent(dispose(undefined, true));
    });
});


test('Disposing queued tada functions preserves the queue order', (t) => {
    const values = [];
    const func1 = () => {
        values.push(1);
    };
    const func2 = () => {
        values.push(2);
    };
    const func3 = () => {
        values.push(3);
    };
    const func4 = () => {
        values.push(4);
        dispose(func3)
    };
    const func5 = () => {
        values.push(5);
    };

    tada(() => {
        tada(func1);
        tada(func4);
        tada(func3);
        tada(func5);
        tada(func2);
    });
    t.alike(values, [1, 4, 5, 2]);
});

test('Disposing a dependant tada function preserves the order of the dependencies', (t) => {
    const object = senals({ x: 10 });

    const values = [];
    const func1 = () => { object.x; values.push(1); };
    const func2 = () => { object.x; values.push(2); };
    const func3 = () => { object.x; values.push(3); };
    const func4 = () => { object.x; values.push(4); };

    tada(func3);
    tada(func2);
    tada(func4);
    tada(func1);
    dispose(func4);

    values.length = 0;
    object.x++;
    t.alike(values, [3,2,1]);
});