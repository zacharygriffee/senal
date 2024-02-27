
### PAUSE API
<a name="Señal"></a>

## Señal : <code>object</code>
**Kind**: global namespace  
<a name="Señal.pause"></a>

### Señal.pause(observer) ⇒ <code>function</code>
Pause a computed observer.

**Kind**: static method of [<code>Señal</code>](#Señal)  
**Returns**: <code>function</code> - resume A function that will only resume this pause. To resume a pause, it must be produced by
the pause that caused it.  

| Param | Type | Description |
| --- | --- | --- |
| observer | <code>object</code> \| <code>function</code> | The observer or function used in the computed. |

**Example**  
```js
const fn = () => x += 5;
tada(fn);
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
