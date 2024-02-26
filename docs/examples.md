## First import senal

```ecmascript 6
import {observe, computed, ignore, dispose, pause} from "simplified-reactivefy"
```

## Some real world examples

Reactivefy provides functions for observing object mutations and acting on those mutations automatically.
Possibly the best way to learn is by example, so let's take a page out of [Vue.js's guide](https://vuejs.org/guide/essentials/event-handling.html) and make a button that counts how many times it has been clicked using Reactivefy's `observe(object)` and `computed(func)`:

```html
<h1>Click Counter</h1>
<button class="reactiveButton" onclick="model.clicks++"></button>
<script>
  const $button = document.querySelector('.reactiveButton');

  const model = observe({
    clicks: 0
  });

  computed(() => {
    $button.innerText = model.clicks ? `I've been clicked ${model.clicks} times` : "Click me!";
  });
</script>
```

Notice how in the above example, the `<button>` doesn't do any extra magic to change its text when clicked; it just increments the model's click counter, which is "connected" to the button's text in the computed function.

Now let's try doing some math, here's a snippet that adds and multiplies two numbers:

```ecmascript 6
const calculator = observe({
  left:    1,
  right:   1,
  sum:     0,
  product: 0
});

// Connect left, right -> sum
computed(() => calculator.sum = calculator.left + calculator.right);
// Connect left, right -> product
computed(() => calculator.product = calculator.left * calculator.right);

calculator.left = 2;
calculator.right = 10;
console.log(calculator.sum, calculator.product); // Output: 12 20

calcuator.left = 3;
console.log(calculator.sum, calculator.product); // Output: 13 30
```

Pretty cool, right?
Reavtivefy's main goal is to be as simple as possible; you only need two functions to build almost anything.

## Examples and snippets

Jump to one of:

- [Concatenator](#concatenator)
- [Debounced search](#debounced-search)
- [Pony browser](#pony-browser)
- [Multiple objects snippet](#multiple-objects-snippet)
- [Linked computed functions snippet](#linked-computed-functions-snippet)

### Concatenator

```html
<h1>Concatenator</h1>
<input type="text" oninput="model.first = value" placeholder="Enter some"/>
<input type="text" oninput="model.second = value" placeholder="text!"/>
<h3 id="output"></h3>
<script>
  const $output = document.getElementById("output");

  const model = observe({
    first: "",
    second: "",
    full: ""
  });

  computed(() => {
    model.full = model.first + " " + model.second;
  });

  computed(() => {
    $output.innerText = model.full;
  });
</script>
```

![](./examples/concatenator-vid.gif)<br>

### Debounced search

```html
<h1>Debounced Search</h1>
<input type="text" oninput="model.input = value" placeholder="Enter your debounced search"/>
<h3 id="search"></h3>
<script>
  const $search = document.getElementById("search");

  const model = observe({
    input: "",
    search: ""
  });

  computed(() => {
    search.innerText = model.search;
  });

  let timeoutID;
  computed(() => {
    const input = model.input;
    if (timeoutID) clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      model.search = input;
    }, 1000);
  });
</script>
```

![](./examples/debounce-vid.gif)<br>

### Pony browser

```html
<main id="app">
  <h1>Pony Browser</h1>
  <select></select>
  <ul></ul>
  <input type="text" placeholder="Add another pony"/>
</main>
<script>
  // Find elements
  const $app = document.getElementById("app");
  const [, $select, $list, $input] = $app.children;

  // Declare model
  const model = observe({
    // Currently selected character set
        selected: {
          key: "mane6",
          current: null // Reference to current character set
        },
        // All character sets
        characterSets: {
          mane6: {
            name: "Mane 6",
            members: [
              "Twilight Sparkle",
              "Applejack",
              "Fluttershy",
              "Rarity",
              "Pinkie Pie",
              "Rainbow Dash"
            ]
          },
          cmc: {
            name: "Cutie Mark Crusaders",
            members: [
              "Apple Bloom",
              "Scootaloo",
              "Sweetie Belle",
              "Babs Seed",
              "Gabby"
            ]
          },
          royalty: {
            name: "Royalty",
            members: [
              "Princess Celestia",
              "Princess Luna",
              "Prince Blueblood",
              "Shining Armor",
              "Princess Cadance",
              "Prince Rutherford",
              "Flurry Heart",
              "Ember",
              "Thorax",
              "Princess Skystar",
              "Queen Novo",
              "Princess Amore"
            ]
          },
          cool: {
            name: "Cool Ponies :P",
            members: [
              "The Great and Powerful Trixie",
              "Derpy (Muffins!)",
              "DJ Pon-3",
              "Discord",
              "Maud Pie",
              "Octavia Melody"
            ]
          }
        }
  });

  // Populate <select>
  for (const [value, { name }] of Object.entries(model.characterSets)) {
    const $option = document.createElement("option");
    $option.value = value;
    $option.innerText = name;
    $select.appendChild($option);
  }

  // Connect model.selected.key -> model.selected.current
  computed(() => {
    model.selected.current = model.characterSets[model.selected.key];
  });

  // Connect model.selected.current.members -> <ul>
  computed(() => {
    $list.innerHTML = "";
    for (const member of model.selected.current.members) {
      const $entry = document.createElement("li");
      $entry.innerText = member;
      $list.appendChild($entry);
    }
  });

  // Connect <select> -> model.selected.key
  $select.addEventListener("change", () => {
    model.selected.key = $select.value;
  });

  // Connect <input> -> model.selected.current.members
  $input.addEventListener("keyup", ({ key }) => {
    if (key !== "Enter") return;

    const currentSet = model.selected.current;
    currentSet.members = [
      ...currentSet.members,
      $input.value
    ];

    $input.value = "";
  });
</script>
```

## Multiple objects snippet

```ecmascript 6
// Setting up some reactive objects that contain some data about a US president...
// Disclaimer: I am not an American :P
const person = observe({
  name: { first: "George", last: "Washington" },
  age: 288
});

const account = observe({
  user: "big-george12",
  password: "IHateTheQueen!1"
});

// Declare that we will output a log message whenever person.name.first, account.user, or person.age are updated
computed(() => console.log(
  `${person.name.first}'s username is ${account.user} (${person.age} years old)`
)); // Output: George's username is big-george12 (288 years old)

// Changing reactive properties will only run computed functions that depend on them
account.password = "not-telling"; // Does not output (no computed function depends on this)

// All operators work when updating properties
account.user += "3"; // Output: George's username is big-george123 (288 years old)
person.age++; // Output: George's username is big-george123 (289 years old)

// You can even replace objects entirely
// This will automatically observe this new object and will still trigger dependant computed functions
// Note: You should ideally use ignore or dispose to prevent depending on objects that get replaced, see pitfalls
person.name = {
  first: "Abraham",
  last: "Lincoln"
}; // Output: Abraham's username is big-george123 (289 years old)

person.name.first = "Thomas"; // Output: Thomas's username is big-george123 (289 years old)
```

### Linked computed functions snippet

```ecmascript 6
// Create our nums object, with some default values for properties that will be computed
const nums = observe({
  a: 33, b: 23, c: 84,
  x: 0,
  sumAB: 0, sumAX: 0, sumCX: 0,
  sumAllSums: 0
});

// Declare that (x) will be equal to (a + b + c)
computed(() => nums.x = nums.a + nums.b + nums.c);
// Declare that (sumAB) will be equal to (a + b)
computed(() => nums.sumAB = nums.a + nums.b);
// Declare that (sumAX) will be equal to (a + x)
computed(() => nums.sumAX = nums.a + nums.x);
// Declare that (sumCX) will be equal to (c + x)
computed(() => nums.sumCX = nums.c + nums.x);
// Declare that (sumAllSums) will be equal to (sumAB + sumAX + sumCX)
computed(() => nums.sumAllSums = nums.sumAB + nums.sumAX + nums.sumCX);

// Now lets check the (sumAllSums) value
console.log(nums.sumAllSums); // Output: 453

// Notice that when we update one value ...
nums.c += 2;
// ... all the other values update! (since we declared them as such)
console.log(nums.sumAllSums); // Output: 459
```

## More simple examples

With `dispose` you can remove the computed function from the reactive Maps, allowing garbage collection

```js
    import { Global } from 'simplified-reactivefy';
    import { expect } from 'chai'

    const { observe, computed, dispose } = Global

    const obj = observe({ a: 0 })
    let result = 0
    let result2 = 0

    const minusOne = computed(() => {
      result2 = obj.a - 1
    })
    computed(() => {
      result = obj.a + 1
    })

    obj.a = 1
    expect(result).to.equal(2)
    expect(result2).to.equal(0)

    dispose(minusOne)

    obj.a = 10
    expect(result).to.equal(11)
    expect(result2).to.equal(0)
```

Multi-observed objects:

```js
    import { Global } from 'simplified-reactivefy';
    import { expect } from 'chai'

    const { observe, computed, dispose } = Global

    const obj1 = observe({ a: 1 })
    const obj2 = observe({ a: 2 })
    const obj3 = observe({ a: 3 })

    let result = 0

    computed(() => {
      result = obj1.a + obj2.a + obj3.a
    })

    expect(result).to.equal(6)
    obj1.a = 0
    expect(result).to.equal(5)
    obj2.a = 0
    expect(result).to.equal(3)
    obj3.a = 0
    expect(result).to.equal(0)
```

### Computed functions can cause infinite loops

```ecmascript 6
const object = observe({ x: 10, y: 20 });

computed(function one() {
  if (object.x > 20) object.y++;
});

computed(function two() {
  if (object.y > 20) object.x++;
});

object.x = 25;
// Uncaught Error: Computed queue overflow! Last 10 functions in the queue:
// 1993: one
// 1994: two
// 1995: one
// 1996: two
// 1997: one
// 1998: two
// 1999: one
// 2000: two
// 2001: one
// 2002: two
// 2003: one
```

### Array mutations do not trigger dependencies

```ecmascript 6
const object = observe({
  array: [1, 2, 3]
});

computed(() => console.log(object.array)); // Output: 1,2,3

object.array[2] = 4; // No output, arrays are not reactive!
object.array.push(5); // Still no output, as Patella does not replace array methods

// If you want to use arrays, do it like this:
// 1. Run your operations
object.array[2] = 3;
object.array[3] = 4;
object.array.push(5);
// 2. Then set the array to itself
object.array = object.array; // Output: 1,2,3,4,5
```

### ~~Properties added after observation are not reactive~~
### Properties added after observation _are_ reactive.

```ecmascript 6
const object = observe({ x: 10 });
object.y = 20;

computed(() => console.log(object.x)); // Output: 10
computed(() => console.log(object.y)); // Output: 20

object.x += 2; // Output: 12
object.y += 2; // Output: 22
```

### Prototypes will not be made reactive unless explicitly observed

```ecmascript 6
const object = { a: 20 };
const prototype = { b: 10 };
Object.setPrototypeOf(object, prototype);

observe(object);

computed(() => console.log(object.a)); // Output: 10
computed(() => console.log(object.b)); // Output: 20

object.a = 15; // Output: 15

object.b = 30; // No output, as this isn't an actual property on the object
prototype.b = 36; // No output, as prototypes are not made reactive by observe

observe(prototype);

prototype.b = 32; // Output: 32
```

### Non-enumerable and non-configurable properties will not be made reactive

```ecmascript 6
const object = { x: 1 };
Object.defineProperty(object, "y", {
  configurable: true,
  enumerable: false,
  value: 2
});
Object.defineProperty(object, "z", {
  configurable: false,
  enumerable: true,
  value: 3
});

observe(object);

computed(() => console.log(object.x)); // Output: 1
computed(() => console.log(object.y)); // Output: 2
computed(() => console.log(object.z)); // Output: 3

object.x--; // Output: 0

object.y--; // No output as this property is non-enumerable
object.z--; // No output as this property is non-configurable
```

### Enumerable and configurable but non-writable properties will be made writable

```ecmascript 6
const object = {};
Object.defineProperty(object, "val", {
  configurable: true,
  enumerable: true,
  writable: false,
  value: 10
});

object.val = 20; // Does nothing
console.log(object.val); // Output: 10

observe(object);

object.val = 20; // Works because the property descriptor has been overwritten
console.log(object.val); // Output: 20
```

~~### Getter/setter properties will be accessed then lose their getter/setters~~
### Getter/Setter properties will not be messed with and will operate normally.

```ecmascript 6
const object = {
  get val() {
    console.log("Gotten!");
    return 10;
  }
};

object.val; // Output: Gotten!

observe(object); // Output: Gotten!

object.val; // Output: Gotten!
```

### Properties named `__proto__` are ignored

```ecmascript 6
const object = {};
Object.defineProperty(object, '__proto__', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: 10
});

observe(object);

computed(() => console.log(object.__proto__)); // Output: 10

object.__proto__++; // No output as properties named __proto__ are ignored
```

### Pause 

```ecmascript 6
const fn = () => x += 5;
computed(fn);
// Things will react here
const resume1 = pause(fn);
const resume2 = pause(fn);
// this observer will not react here
resume1();
// things still won't react
resume1();
// nope
resume2();
// things will be reactive again.
```