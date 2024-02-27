
### INCITER API
<a name="Señal"></a>

## Señal : <code>object</code>
**Kind**: global namespace  
<a name="Señal.inciter"></a>

### Señal.inciter(any, reason, [meta])
Wrap anything to become an immutable inciter that can be passed to tada

Reserved reasons: initial, collection, property, manual

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
