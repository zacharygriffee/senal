
### DISPOSE API
<a name="Señal"></a>

## Señal : <code>object</code>
**Kind**: global namespace  
<a name="Señal.dispose"></a>

### Señal.dispose(observer) ⇒ <code>function</code>
Dispose a tada observer. A disposed tada cannot be used again.

**Kind**: static method of [<code>Señal</code>](#Señal)  
**Returns**: <code>function</code> - `observer` argument is returned except in the case of error.  

| Param | Type | Description |
| --- | --- | --- |
| observer | <code>function</code> \| <code>object</code> | A function or tada that is being used in tada |

**Example**  
```js
import {dispose, tada} from "senal";

const disposable = tada(() => {
    // do tada things;
});

dispose(disposable);
```
