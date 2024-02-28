
### TADA API
<a name="Señal"></a>

## Señal : <code>object</code>
**Kind**: global namespace  

* [Señal](#Señal) : <code>object</code>
    * [.tada(observer, [...filters])](#Señal.tada) ⇒
        * [.ITERATOR](#Señal.tada+ITERATOR) : <code>Iterator.&lt;inciter&gt;</code>
        * [.retro([subscribeOnSet])](#Señal.tada+retro) ⇒ <code>Proxy</code>
        * [.pronto([subscribeOnSet])](#Señal.tada+pronto) ⇒ <code>Proxy</code>
        * [.addFilter(...filters)](#Señal.tada+addFilter) ⇒ <code>executable</code>
        * [.error(error)](#Señal.tada+error) ⇒ <code>function</code>
        * [.complete()](#Señal.tada+complete) ⇒ <code>function</code>
        * [.completeNextTick()](#Señal.tada+completeNextTick) ⇒ <code>\*</code>
        * [.next()](#Señal.tada+next) ⇒ <code>function</code>
        * [.unsubscribe()](#Señal.tada+unsubscribe)

<a name="Señal.tada"></a>

### Señal.tada(observer, [...filters]) ⇒
Observe an object or function that can be incited by [senals](Señal.senal), tadas, [custom inciters](Señal.inciter),
and it can even incite itself.

**Kind**: static method of [<code>Señal</code>](#Señal)  
**Returns**: A function and observer merger of the tada.  

| Param | Type | Description |
| --- | --- | --- |
| observer | <code>object</code> \| <code>function</code> | An observer or function. An observer contract has { next, complete, error } functions. If a function is supplied, it will become the `next` function and any errors that occur will be thrown instead of caught. the complete function happens when the tada is disposed or unsubscribed. |
| [...filters] | <code>array.&lt;(string\|function()\|boolean)&gt;</code> | See config.filters |

**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [readOnly] | <code>boolean</code> | <code>false</code> | If readonly true, any properties of senals of the tada will not be changed.      **Warning** Any side effects produced by this tada will still occur. **readonly applies only to senals** within the      tada observer. This does not prevent other writable tadas from changing properties of the senals. |
| [completed] | <code>boolean</code> | <code>false</code> | If this tada was completed. |
| [paused] | <code>number</code> | <code>0</code> | IF paused this number will be greater than 0, and determines how many pauses exist. You can force an observer to resume by changing this to 0 just be cautious that some dependants of a pause may behave unexpectedly. |
| [inQueue] | <code>boolean</code> | <code>false</code> | Whether this observer is in the queue waiting to be executed. |
| [errored] | <code>boolean</code> | <code>false</code> | Whether this observer incurred an error and cannot react to inciters. |
| [id] | <code>string</code> \| <code>Symbol</code> \| <code>number</code> |  | An identifier to use for the tada. Keep this distinct as untold misery may occur. |
| [filters] | <code>Array.&lt;(function()\|String\|Boolean\|Object)&gt;</code> \| <code>function</code> \| <code>String</code> \| <code>Boolean</code> \| <code>Object</code> |  | An array of strings and functions to filter the tada based on the inciter that triggers the observer. see [tada.addFilter](tada.addFilter) for in-depth elaboration on filters. |

**Example**  
```js
// basic usage
const vector2 = senals({x: 5};
tada((inciter) => {
    vector1.x;       // This causes tada subscription to vector1.x changes.
    vector2.y = 10;  // Unless senals config.subscribeOnSet, vector1.y won't cause this tada to react.
});

vector2.y = 5; // doesn't cause a tada.
vector1.x = 2; // this will, and vector2.y will equal 10;
```
**Example**  
```js
// filter usage
// A tada must run at least once to collect senals to be able to react to them.
// So to prevent a tada initially, simply set an empty array as the only argument other than the observer.
const exampleTada = tada(inciter => {}, []);
// A tada by default has these filtered reasons: ["initial", "property", "collection", "manual"]
// The property reason depends on initial reason, so there has to be another way to incite
// the tada before they work.
const isRobot = ["robot", "robots", "deepThought", "r2d2"];
exampleTada.addFilter("initial", ["property", "collection"], isRobot, "manual"); // Arrays are flattened into ...args.
```

* [.tada(observer, [...filters])](#Señal.tada) ⇒
    * [.ITERATOR](#Señal.tada+ITERATOR) : <code>Iterator.&lt;inciter&gt;</code>
    * [.retro([subscribeOnSet])](#Señal.tada+retro) ⇒ <code>Proxy</code>
    * [.pronto([subscribeOnSet])](#Señal.tada+pronto) ⇒ <code>Proxy</code>
    * [.addFilter(...filters)](#Señal.tada+addFilter) ⇒ <code>executable</code>
    * [.error(error)](#Señal.tada+error) ⇒ <code>function</code>
    * [.complete()](#Señal.tada+complete) ⇒ <code>function</code>
    * [.completeNextTick()](#Señal.tada+completeNextTick) ⇒ <code>\*</code>
    * [.next()](#Señal.tada+next) ⇒ <code>function</code>
    * [.unsubscribe()](#Señal.tada+unsubscribe)

<a name="Señal.tada+ITERATOR"></a>

#### tada.ITERATOR : <code>Iterator.&lt;inciter&gt;</code>
[Symbol.iterator]
Iterate all dependants within the tada.

This depends on the 'collection' `reason` to operate. If tada does not have 'collection' reason in its filter
this will return an empty array.

Note: This sets tada.readOnly=true  for the duration (synchronously) of the dependent collection and then back
to the previous readOnly configuration.  **Warning** Because the iterator accesses the tada function
in readOnly mode, any side effects produced not related to senals by this tada will still occur.
readOnly applies only to senals. If you have a tada with side effects, and you'd like to prevent collection
from inciting them, you can remove the `collection` reason from the filter.

The dependant of the tada will be wrapped in an inciter
[see inciter](Señal.inciter) for more information.

**Kind**: instance property of [<code>tada</code>](#Señal.tada)  
**Todo**

- [ ] Support async tadas

**Example**  
```js
const obs1 = observe();
const obs2 = observe();
const $$$ = tada(() => {
    obs.x;
    obs.y = 5;
    obs2.x = 2;
});

for (const dependent of $$$) {
    dependent.cause // the dependent observable to this tada
    dependent.type  // whether this dependent is setter ("set") or getter ("get")
    dependent.property // the property of the senal that this tada is dependent on.
}
```
<a name="Señal.tada+retro"></a>

#### tada.retro([subscribeOnSet]) ⇒ <code>Proxy</code>
Collects senal get (and optionally set) of the last tick and subscribes to them.

**Kind**: instance method of [<code>tada</code>](#Señal.tada)  
**Returns**: <code>Proxy</code> - observer  

| Param | Default | Description |
| --- | --- | --- |
| [subscribeOnSet] | <code>false</code> | If true, will also collect senal sets |

**Example**  
```js
// if true, will also subscribe on sets.
let subscribeOnSet = false;
const s = senal();
s.x;
s.y;
s.x = 5; // This will cause reaction if subscribeOnSet=true;
tada(() => {
    // will reacte to the above two gets.
 }).retro(subscribeOnSet);
```
<a name="Señal.tada+pronto"></a>

#### tada.pronto([subscribeOnSet]) ⇒ <code>Proxy</code>
Collects senals get (and optionally set) of the next tick and subscribes to them.

**Kind**: instance method of [<code>tada</code>](#Señal.tada)  
**Returns**: <code>Proxy</code> - observer  

| Param | Default | Description |
| --- | --- | --- |
| [subscribeOnSet] | <code>false</code> | If true, will also collect senal sets |

**Example**  
```js
// if true, will also subscribe on sets.
let subscribeOnSet = false;

const s = senal();
tada(() => {
    // will reacte to the above two gets.
 }).pronto(subscribeOnSet);

s.x;
s.y;
s.x = 5; // This will cause reaction if subscribeOnSet=true;
```
<a name="Señal.tada+addFilter"></a>

#### tada.addFilter(...filters) ⇒ <code>executable</code>
Convenience method to add a filter to the observer without overwriting defaults or already added fitlers.
The Tada's observer does expose the filters array for you to manipulate them directly so either use this, or
simply observer.filters.push([(one) => !!one.or, "Several", "FilterOptions"], ...FromBelow).

**array**

Will be flattened and its entries will be added and processed as explained in below filter entries.

**function**

A function that is supplied the inciter. Returning a 'falsy' value will fail the filter entirely.

**object** or switch

An object can be used to dereference a reactive at the time of filtering. So I like to call them switches.

<pre>
    const robot = senal({on: true, type: "robot", isFriendly: () => true});
    const ta = tada(() => {
        // This will only incite when s.on === true
        // isFriendly executes to truthy
        // and the 'robot' becomes a 'reason' this tada can be incited.
    }, {on: robot, type: robot}).addFilter({ isFriendly: robot });
</pre>

**string**
Or called 'reason' throughout the api.

String filters are directly correlated to `inciter.reason` [Señal.inciter](Señal.inciter) and every 'tada' has an inciter
that triggered that tada. If the reason exists in any of the entries, the filter will succeed pending that all the
function/switch filters work out. The following reasons cannot be used in custom inciter reasons.

There are default reasons added to every tada:

<pre>
    reason       inciter     description
    initial      tada        immediately occurring once tada is made. If not part of the filters,
                             it is necessary to trigger the initial registrations by other ways
                             like manual, or collection or custom-made inciter.

    collection   tada        when the tada is enumerated (e.g. const [reg1, reg2, ...etc] = someTada;).
                             This will trigger this tada but with readOnly=true.

                             See config.readOnly and [Symbol.iterator] for more details and cautions about
                             side effects.

   property      senal       When a property changes of a senal that is registered to this tada.
                             If senal.config.subscribeOnSet, this will also be triggered with that senal's sets.

   manual        tada        When a manual execution of the tada occurs:
                             const someTada = tada((inciter) => {
                                 inciter.value === 'someValue';
                                 inciter.reason === "manual";
                                 inciter.cause === someTada;
                             });
                             someTada("someValue");
                             someTada.next("someValue");
</pre>

There are reasons that are not added by default, these are also reserved reasons:
<pre>
    complete     tada        When a tada completes either by dispose(tada) or tada.unsubscribe() or tada.complete()
    error        tada        When a tada observer errors.
</pre>

**Kind**: instance method of [<code>tada</code>](#Señal.tada)  

| Param | Type |
| --- | --- |
| ...filters | <code>Array.&lt;(function()\|String\|Boolean\|Object)&gt;</code> \| <code>function</code> \| <code>String</code> \| <code>Boolean</code> \| <code>Object</code> | 

<a name="Señal.tada+error"></a>

#### tada.error(error) ⇒ <code>function</code>
An errored tada cannot be started again.

**If using the observer contract**, the error function will be called when an error occurs inside the 'next'
function. When using the contract and error function is defined in the observer interface, the error is assumed
to be caught. This function can also be called manually, to stop the tada immediately. This will also communicate
to registered senals of the error to be removed from their subscriptions.

**If not using the observer contract**

Any errors that are produced by tada will just throw it which you could try catch.

At the moment, errored tada are not recoverable.

If the `error` reason was added in the filter, the tada will be incited one more time with an inciter that contains
a property 'error' with the error that happened. Only do this if the tada can handle running after an error one more time.
This is similar to a 'catch' clause but the `tada` is not usable again (as of current version of Señal).

**Kind**: instance method of [<code>tada</code>](#Señal.tada)  

| Param | Description |
| --- | --- |
| error | The error that occurred |

**Example**  
```js
const $$$ = tada({
    next() {
        throw new Error("this is error");
    },
    error(e) {
        // after next is triggered, this will be called.
    }
});

// you could call it manually from the outside.
$$$.error(new Error("This is outside error"));
```
<a name="Señal.tada+complete"></a>

#### tada.complete() ⇒ <code>function</code>
A completed tada cannot be started again.

**If using the observer contract**, The complete function will occur when the tada had been disposed,
unsubscribed, or manually completed.

**If not using the observer contract**
complete will do nothing

If you would like a tada to be stopped and started, use pause/resume function. But if you don't plan on using it
again, use complete to unregister potentially memory-leaking subscriptions.

If the `complete` reason was added in the filter, the tada will be incited one more time before being disposed with
no additional context added to the complete inciter. This is similar to a `finally` clause of a `try catch`

**Kind**: instance method of [<code>tada</code>](#Señal.tada)  
**Example**  
```js
const $$$ = tada({
    complete() {
         console.log("TADA completed!!!");
    }
});

$$$.complete();
// or
$$$.unsubscribe();
// or
dispose($$$);
```
<a name="Señal.tada+completeNextTick"></a>

#### tada.completeNextTick() ⇒ <code>\*</code>
Completes the tada on the next tick.

**Kind**: instance method of [<code>tada</code>](#Señal.tada)  
<a name="Señal.tada+next"></a>

#### tada.next() ⇒ <code>function</code>
**The incitable tada**
When passing a function to tada i.e. tada((inciter) => {}), the function becomes `next`.
tada((inciter) => {}) === tada({next(inciter) => {});
The `next`  will be called on each reaction by an inciter that satisfies the filter.
The only argument of `next` is the [Señal.inciter](Señal.inciter).

**Manually incite tada**
- If an inciter is passed, the reason of the inciter must be present in the tada's filter.
- If any other value is passed, the reason becomes `manual` and the value passed will become the inciter's
value.

This is also triggered under the hood by [Señal.senals](Señal.senals).

If the tada was not started immediate (i.e. `initial` reason absent from `filters` on tada creation) but
initial was added to filters before anything incited it, the tada will incite with `initial` and then
the manual incitable.

**Kind**: instance method of [<code>tada</code>](#Señal.tada)  
**See**: Señal.inciter  
**Example**  
```js
const $$$ = tada({
    next(inciter) {
         // Triggered by inciter
    }
});

// OR
const $$$ = tada((inciter) => {
    // Triggered by inciter
});

// inciter
$$$.next("whatever value");

// Or
$$$("whatever value");
```
**Example**  
```js
// if initial was added afterwards
const $$$ = tada((inciter) => {
    // initial inciter first
    // then triggered by inciter

    // The 'initial' reason is not present in filters.
}, "manual");

$$$.addFilter("initial");
$$$("this triggered after initial incite only because initial was added after");
```
<a name="Señal.tada+unsubscribe"></a>

#### tada.unsubscribe()
Convenience function for complete that helps interop with other observables types.

**Kind**: instance method of [<code>tada</code>](#Señal.tada)  
