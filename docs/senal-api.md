
### SENAL API
<a name="Señal"></a>

## Señal : <code>object</code>
**Kind**: global namespace  
<a name="Señal.senal"></a>

### Señal.senal(object, config) ⇒ <code>Proxy</code> \| <code>function</code>
Observe an object or function and returns a reactive observable.

**Kind**: static method of [<code>Señal</code>](#Señal)  
**Returns**: <code>Proxy</code> \| <code>function</code> - A proxy of the object. Operations on the proxy will signal to tada function.
Changes made on the proxy will be reflected on the original object. However, making changes in the original object
will not trigger signals.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| object | <code>object</code> \| <code>function</code> |  | An object or function (which is treated like an object). |
| config |  |  |  |
| [config.deep] | <code>boolean</code> | <code>true</code> | Whether to make nested objects and added nested objects reactive. |
| [config.subscribeOnSet] | <code>boolean</code> | <code>false</code> | Whether a set inside a tada function will trigger subscription. By default, you have to access a property in a tada for the property changes to be subscribed to.  IF set to true setting a property inside a tada will trigger its subscription if it isn't already, `e.g. object.property = 42;` will cause a subscription to tada. If not careful, you could trigger stack overflow. |
| [config.arrayToObject] | <code>boolean</code> | <code>false</code> | If set to true, any array that is encountered will be converted into an array like object. Without the proper methods to handle array-like operations, you might want to keep this false. |
| [config.startReactive] | <code>boolean</code> | <code>true</code> | Not implemented just yet. |

