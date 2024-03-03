
### INCITER API
<a name="Señal"></a>

## Señal : <code>object</code>
**Kind**: global namespace  
<a name="Señal.inciter"></a>

### Señal.inciter(any, reason, [meta])
Wrap anything to become an immutable inciter that can be passed to tada

- What? An observable (senals) pushes the material the observers signed up for
- Who? An observer (tada) is the consumer of that data.
- Why/How? An inciter is the `reason` or 'manifest' of why and how the material was pushed to consumer.

The inciter is experimental, and subject to change between versions.

Reserved reasons: initial, invocation, collection, property, manual

**Kind**: static method of [<code>Señal</code>](#Señal)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| any | <code>\*</code> |  | Any value. If passing an inciter, will return that inciter as is. |
| reason | <code>string</code> |  | A string representing the reason of this inciter. |
| [meta] | <code>\*</code> | <code>{}</code> | Additional meta context for the inciter. If a non-object is supplied, the inciter will obtain a 'value' property i.e. meta = {value: meta}; |

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| cause | <code>\*</code> | the 'any' argument |
| reason | <code>string</code> | the `reason` argument |

**Example**  
```js
// Make the robot
const deepThought = {answer: 42};
// Make the robot incitable and give it a 'reason' of 'robots'
const deepThoughtInciter = inciter(deepThought, "robots");
// Overwrite all other reasons by adding 'robots' reason to the end.
const $$$ = tada((inciter) => { inciter.cause.answer === 42; }, "robots");
// or add a reason to the reasons that already exist.
const $$$ = tada((inciter) => { inciter.cause.answer === 42; });
$$$.addFilter("robots");
// And then the incitable can incite a tada with context.
$$$.next(deepThoughtInciter);
// Sure you could just do this
$$$.next(deepThought);
// but 'deepThought' will be internally added as a 'manual' inciter with no additional context.
```
**Example**  
```js
// Invocation inciter
// Additional properties of invocation inciter
inciter.args;    // Readonly arguments supplied to the invoked senal function
inciter.thisArg; // The 'this' binding of the invoked senal function
inciter.property // If the function has a name or part of a senal object, will have the function name.
                 // If the function is part of a senal object, you can count on this. Otherwise, your results
                 // may vary which depend on your minification settings.


// Both senal<function> and tada.intercept have their own examples for this concept.

// These inciter gates will change the result of a function invocation.

// accept the invocation but change the first argument.
     inciter.accept("Coleslaw is disgusting");
// use another function instead
// replacement args simply replaces whatever args of the original invocation
     inciter.instead((...args) => "Coleslaw is disgusting!!!", ...replacementArgs);
// This will not run the original function and supply your own return value
     inciter.shim("Coleslaw is disgusting!!!");
```
