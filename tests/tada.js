import {skip, test, solo} from "brittle";
import {senal} from "../lib/senal.js";
import {tada} from "../lib/tada.js";
import {nonFunctions} from "./fixtures/nonFunctions.js";

test('A tada fails if passed a non-callable value', (t) => {
    nonFunctions.forEach(val => t.exception(() => tada(val)));
});

test('Nested tada functions do not share dependencies', (t) => {
    const o = senal({
        by: 2,
        value: 2,
        times: 0
    });
    tada(() => {
        tada(() => {
            o.value *= o.by;
        });
        o.times++;
    });

    t.is(o.times, 1);
    t.is(o.value, 4);
    o.by = 4;
    t.is(o.times, 1);
    t.is(o.value, 16);
    o.by = 2;
    t.is(o.times, 1);
    t.is(o.value, 32);
    o.by = 5;
    t.is(o.times, 1);
    t.is(o.value, 160);
});


test('A tada functions will notify eachother continuously', (t) => {
    const o = senal({
        one: null,
        two: null,
        three: null,
        four: null,
        five: null,
        six: null
    });
    tada(() => o.two = o.one);
    tada(() => o.three = o.two);
    tada(() => o.four = o.three);
    tada(() => o.five = o.four);
    tada(() => o.six = o.five);

    t.alike(Object.values(o), [, , , , , ,].fill(null));
    o.one = 'Hello!';
    t.alike(Object.values(o), [, , , , , ,].fill('Hello!'));
    o.one = 1;
    t.alike(Object.values(o), [, , , , , ,].fill(1));
});

test('A tada functions nested in another tada function are added to the queue', (t) => {
    let executed = false;
    tada(() => {
        tada(() => {
            executed = true;
        });
        t.is(executed, false);
    });
    t.is(executed, true);
});


test('Multiple (implicitly) senals with one tada function using iterators', (t) => {
    const o = senal({x: null, y: null, z: null, p: null});
    const numSet = () => ({a: 10, b: 20, c: 30});
    o.x = numSet();
    o.y = numSet();
    o.z = numSet();
    tada(() => {
        let p;
        for (let numKey in o) {
            const numSet = o[numKey];
            for (let key in numSet) {
                p = p ? p * numSet[key] : numSet[key];
            }
        }
        o.p = p;
    });

    t.is(o.p, 216000000000);
    o.y.b += 2;
    t.is(o.p, 237600000000);
});


test("A tada functions can depend on multiple properties of a reactive object", async t => {
    const o = senal({
        fullName: '',
        firstName: '',
        middleNames: [],
        lastName: ''
    });
    tada(() => {
        const names = [];

        if (o.firstName) names.push(o.firstName);
        names.push(...o.middleNames);
        if (o.lastName) names.push(o.lastName);

        o.fullName = names.join(' ');
    });

    t.is(o.fullName, '');
    o.firstName = 'Lua';
    t.is(o.fullName, 'Lua');
    o.lastName = 'MacDougall';
    t.is(o.fullName, 'Lua MacDougall');
    o.middleNames.push('\'WTF\''); // Does not notify dependencies
    o.middleNames = o.middleNames; // Forcefully notifies dependencies
    t.is(o.fullName, 'Lua \'WTF\' MacDougall');
});


test("Senal objects can have tada functions attached to them", async t => {
    let o = senal({number: 10, doubledNumber: undefined});
    tada(() => o.doubledNumber = o.number * 2);
    t.is(o.doubledNumber, 20);
    o.number = 20;
    t.is(o.doubledNumber, 40);
});

test("Multiple tada functions attached to one reactive object", async t => {
    const o = senal({x: 0, y: 0, z: 0});
    tada(() => o.y = o.x + 1);
    tada(() => o.z = o.y + 1);

    t.alike(o, {x: 0, y: 1, z: 2});
    o.x = 30;
    t.alike(o, {x: 30, y: 31, z: 32});
});

test("One tada function attached to multiple reactive objects", async t => {
    const word1 = senal({word: 'Hello'});
    const word2 = senal({word: 'world'});
    let o;
    tada(() => o = word1.word + ' ' + word2.word);

    t.is(o, "Hello world");
    word2.word = 'you';
    t.is(o, "Hello you");
});

test('A tada execute in the order they are notified', (t) => {
    const values = [];
    const func1 = () => values.push(1);
    const func2 = () => values.push(2);
    const func3 = () => values.push(3);
    const func4 = () => values.push(4);
    tada(() => {
        tada(func2);
        tada(func4);
        tada(func1);
        tada(func3);
        t.alike(values, []);
    });

    t.alike(values, [2, 4, 1, 3]);
});

test('A tada can be notified multiple times but cannot be queued multiple times', (t) => {
    const values = [];
    const func1 = () => values.push(1);
    const func2 = () => values.push(2);
    const func3 = () => values.push(3);
    const func4 = () => values.push(4);

    tada(func1);
    tada(func2);
    tada(func1);
    tada(func3);
    tada(func4);
    tada(func3);
    t.alike(values, [1, 2, 1, 3, 4, 3]);

    values.length = 0;
    tada(() => {
        tada(func1);
        tada(func2);
        tada(func1);
        tada(func3);
        tada(func4);
        tada(func3);
        t.alike(values, []);
    });
    t.alike(values, [1, 2, 3, 4]);
});

test('Object dependencies are notified in the order they are added', (t) => {
    const object = senal({x: 10});

    const values = [];
    const func1 = () => {
        object.x;
        values.push(1);
    };
    const func2 = () => {
        object.x;
        values.push(2);
    };
    const func3 = () => {
        object.x;
        values.push(3);
    };
    const func4 = () => {
        object.x;
        values.push(4);
    };

    tada(func2);
    tada(func3);
    tada(func1);
    tada(func4);
    t.alike(values, [2, 3, 1, 4]);

    values.length = 0;
    object.x++;
    t.alike(values, [2, 3, 1, 4]);
});

test('Tadas are always notified in the order senals subscribe', (t) => {
    const object1 = senal({x: 10});
    const object2 = senal({x: 10});

    const values = [];
    let ignoreTwo = true;
    const fn = num => () => {
        object1.x, ignoreTwo || object2.x;
        values.push(num);
    };
    const func1 = fn(1);
    const func2 = fn(2);
    const func3 = fn(3);
    const func4 = fn(4);

    tada(func3);
    tada(func2);
    tada(func4);
    tada(func1);
    ignoreTwo = false;
    tada(func1);
    tada(func2);
    tada(func3);
    tada(func4);

    values.length = 0;
    object1.x++;
    t.alike(values, [3, 2, 4, 1]);

    values.length = 0;
    object2.x++;
    t.alike(values, [1, 2, 3, 4]);
});
