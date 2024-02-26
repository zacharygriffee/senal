import {test, solo} from "brittle";
import {senal} from "../lib/senal.js";
import {ignore} from "../lib/ignore.js";
import {tada} from "../lib/tada.js";
import {nonObjects} from "./fixtures/nonObjects.js";

test('Ignored objects are still valid and can be used in reactive properties', (t) => {
    const o = senal({
        sum1: {a: null, b: null, sum: null},
        sum2: ignore({a: null, b: null, sum: null})
    });
    const o2 = sumObject =>
        tada(() => sumObject.sum = sumObject.a + sumObject.b);
    o2(o.sum1);
    o2(o.sum2);

    t.alike(o, {
        sum1: {a: null, b: null, sum: 0},
        sum2: {a: null, b: null, sum: 0}
    });
    o.sum1.a = 10;
    o.sum1.b = 20;
    t.is(o.sum1.sum, 30);
    o.sum2.a = 10;
    o.sum2.b = 20;
    t.is(o.sum2.sum, 0);
});

test('Ignore can be used to replace objects in reactive properties without leaking', (t) => {
    const vectors = senal({
        v1: ignore({}),
        v2: ignore({}),
        sum: null,
        product: null
    });
    tada(() =>
        vectors.sum = ignore({
            x: vectors.v1.x + vectors.v2.x,
            y: vectors.v1.y + vectors.v2.y,
            z: vectors.v1.z + vectors.v2.z
        })
    );
    tada(() =>
        vectors.product = ignore({
            x: vectors.v1.x * vectors.v2.x,
            y: vectors.v1.y * vectors.v2.y,
            z: vectors.v1.z * vectors.v2.z
        })
    );

    t.alike(vectors, {
        v1: {}, v2: {},
        sum: {x: NaN, y: NaN, z: NaN},
        product: {x: NaN, y: NaN, z: NaN}
    });
    vectors.v1 = ignore({x: 20, y: 0, z: 0});
    vectors.v2 = ignore({x: 20, y: 20, z: 20});
    t.alike(vectors.sum, {x: 40, y: 20, z: 20});
    t.alike(vectors.product, {x: 400, y: 0, z: 0});
});

test('Ignored objects are not reactive', (t) => {
    const squarer = senal({
        numberToSquare: ignore({number: 10}),
        square: null
    });
    const squareComputer = tada(() => {
        squarer.square = squarer.numberToSquare.number ** 2;
    });

    t.is(squarer.square, 100);
    squarer.numberToSquare.number = 8;
    t.is(squarer.square, 100);
    tada(squareComputer);
    t.is(squarer.square, 64);
});

test('Ignore fails if passed a non-object (not including arrays) value', (t) => {
    nonObjects.forEach(val => t.exception(() => ignore(val)));
});


test('Ignore returns its first argument', (t) => {
    const object = {};
    t.is(ignore(object), object);
    t.is(ignore(ignore(object)), object);
});
