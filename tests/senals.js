import {skip, test, solo} from "brittle";
import {nonObjects} from "./fixtures/nonObjects.js";
import {senal} from "../lib/senal.js";
import {tada} from "../lib/tada.js";

test('Senals fails if passed a non-object (not including arrays) value', (t) => {
    nonObjects.forEach(val => t.exception(() => senal(val)));
});

test('Setting an object onto a reactive property makes the object reactive', (t) => {
    const summit = senal({nums: null, total: null});
    summit.nums = {a: 10, b: 20, c: 30};
    tada(() =>
        summit.total =
            summit.nums.a
            + summit.nums.b
            + summit.nums.c
    );

    t.is(summit.total, 60);
    summit.nums.b -= 10;
    t.is(summit.total, 50);
});

test("Senals is recursive and will make subobjects reactive", async t => {
    const coolness = senal({
        you: {cool: false},
        me: {cool: true},
        superCool: false
    });
    tada(() => coolness.superCool = coolness.you.cool && coolness.me.cool);

    t.is(coolness.superCool, false);
    coolness.you.cool = true;
    t.is(coolness.superCool, true);
});

test('Replace objects in reactive properties works OK (but may leak the old object)', (t) => {
    const database = senal({user: null});
    database.user = {
        login: 'luawtf',
        password: 'uwu',
        attempt: {password: null, correct: false}
    };
    tada(() =>
        database.user.attempt.correct =
            database.user.attempt.password === database.user.password
    );

    t.is(database.user.attempt.correct, false);
    database.user.attempt.password = 'uwu';
    t.is(database.user.attempt.correct, true);
    // Next line is bad practice, will leak the original `database.user.attempt`
    // as the computed function still depends on it, consider cleaning up using
    // dispose (clean mode) and then computed
    database.user.attempt = {password: 'owo', correct: true};
    t.is(database.user.attempt.correct, false);
    database.user.attempt.password = 'uwu';
    t.is(database.user.attempt.correct, true);
});

test('Properties that share names with Object.prototype properties work as expected', (t) => {
    const object = senal({hasOwnProperty: 10});
    let val;
    tada(() => val = object.hasOwnProperty);

    t.is(val, 10);
    object.hasOwnProperty = 20;
    t.is(val, 20);
});


test('Nonconfigurable properties will not be made reactive', (t) => {
    const object = senal(Object.defineProperty({}, 'val', {
        configurable: false,
        enumerable: true,
        writable: true,
        value: 10
    }));
    let val;
    tada(() => val = object.val);

    t.is(val, 10);
    object.val = 20; // Not reactive
    t.is(val, 10);
});

test('Nonenumerable properties will not be made reactive', (t) => {
    const object = senal(Object.defineProperty({}, 'val', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: 10
    }));
    let val;
    tada(() => val = object.val);

    t.is(val, 10);
    object.val = 20; // Not reactive
    t.is(val, 10);
});

test('Nonwritable but enumerable and configurable properties will be overwritten and made writable', (t) => {
    const object = senal(Object.defineProperty({}, 'val', {
        configurable: true,
        enumerable: true,
        writable: false,
        value: 10
    }));

    t.is(object.val, 10);
    object.val = 20;
    t.is(object.val, 20);
});

test('Enumerable and configurable properties will remain enumerable and configurable', (t) => {
    const oldDescriptor = {
        configurable: true,
        enumerable: true,
        writable: false,
        value: 10
    };
    const object = senal(Object.defineProperty({}, 'val', oldDescriptor));
    const newDescriptor = Object.getOwnPropertyDescriptor(object, 'val');

    t.is(!!newDescriptor.enumerable, !!oldDescriptor.enumerable);
    t.is(!!newDescriptor.configurable, !!oldDescriptor.configurable);
});


test('Properties named __proto__ will not be made reactive', (t) => {
    const object = Object.defineProperty(Object.create(null), '__proto__', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: 10
    });

    object.__proto__ = 20;
    t.is(object.__proto__, 20);
    t.is(Object.getPrototypeOf(object), null);

    const descriptor = () => Object.assign({}, Object.getOwnPropertyDescriptor(object, '__proto__'));

    const originalDescriptor = descriptor();
    senal(object);
    const senalDescriptor = descriptor();

    t.alike(senalDescriptor, originalDescriptor);
});

test('Arrays are not reactive (by default)', (t) => {
    const object = senal({array: [1, 2, 3]});
    let times = 0;
    tada(() => (object.array[1], times++));

    t.is(times, 1);
    object.array[1] = 4; // Not reactive
    t.is(times, 1);
    object.array.pop();
    object.array.pop();
    object.array.push(3); // Still not reactive :P (no array function hacks)
    t.is(times, 1);
    object.array[1] = 10;
    object.array = object.array; // There we go!
    t.is(times, 2);
});

test('Reactive properties can be get/set like normal', (t) => {
    const object = senal({value: 10});

    t.is(object.value, 10);
    object.value = 20;
    t.is(object.value, 20);
    object.value = {x: 10};
    t.alike(object.value, {x: 10});
    object.value += 10;
    t.is(object.value, '[object Object]10');
});

test('Senals objects can be iterated through and spread', (t) => {
    const o = senal({a: 10, b: 20, c: 30});
    const spread = {...o};
    const identical = {a: 10, b: 20, c: 30};

    t.alike(o, spread);
    t.alike(o, identical);
    t.alike(spread, identical);

    const keysExpected = ['a', 'b', 'c'];

    let keys = [];
    for (const key in o) keys.push(key);
    t.alike(keys, keysExpected);

    t.alike(Object.keys(o), keysExpected);
    t.alike(Object.values(o), [10, 20, 30]);
});

test('Senals objects can have cyclic references', (t) => {
    const object1 = {object2: undefined, value: !0};
    const object2 = {object1: undefined, value: !1};
    object1.object2 = object2;
    object2.object1 = object1;

    senal(object1);

    t.alike(object1.object2, object2);
    t.alike(object2.object1, object1);
    t.alike(object1.object2.object1, object1);
    t.alike(object2.object1.object2, object2);
    t.alike(object1.object2.object1.object2.object1.object2, object2);

    t.alike(object1.object2.object1.object2.object1.value, true);
    t.alike(object2.object1.object2.object1.object2.value, false);
});


test('Functions can be made reactive', (t) => {
    const func = senal(function () {
    })

    func.x = 10;
    senal(func);

    let times = 0;
    tada(() => (func.x, times++));

    t.is(times, 1);
    func.x++;
    t.is(times, 2);
});

test('Reactive functions can be called', (t) => {
    let value;

    const func = senal(function (newValue) {
        value = newValue;
    });

    func(50);
    t.is(value, 50);
});