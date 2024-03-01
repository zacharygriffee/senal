
### SENAL API
<a name="Señal"></a>

## Señal : <code>object</code>
**Kind**: global namespace  
<a name="Señal.senal"></a>

### Señal.senal(object, config) ⇒ <code>Proxy</code> \| <code>function</code>
Observe an object or function and returns a reactive observable.

<pre>
Overloads
     senal();                                      // creates empty reactive object
     senal({prop: 5});                             // creates a reactive object with existing properties
     senal(() => {});                              // creates a reactive function that can be
                                                   // intercepted and gated (see tada.intercept)
     senal(                                        // create a reactive array like object.
          ["hello", "world"],                      // the senal obtains array manipulating functions
          { arrayToObject: true }                  // arrayToObject config must be true otherwise
     );
</pre>

**Kind**: static method of [<code>Señal</code>](#Señal)  
**Returns**: <code>Proxy</code> \| <code>function</code> - A proxy of the object. Operations on the proxy will signal to tada function.
Changes made on the proxy will be reflected on the original object. However, making changes in the original object
will not trigger signals.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| object | <code>object</code> \| <code>function</code> |  | An object or function or array (if arrayToObject=true). |
| config |  |  |  |
| [config.deep] | <code>boolean</code> | <code>true</code> | Whether to make nested objects and added nested objects reactive. |
| [config.subscribeOnSet] | <code>boolean</code> | <code>false</code> | Whether a set inside a tada function will trigger subscription. By default, you have to access a property in a tada for the property changes to be subscribed to.  IF set to true setting a property inside a tada will trigger its subscription if it isn't already, `e.g. object.property = 42;` will cause a subscription to tada. If not careful, you could trigger stack overflow. |
| [config.arrayToObject] | <code>boolean</code> | <code>false</code> | If set to true, any array that is encountered will be converted into an array like object. Without the proper methods to handle array-like operations, you might want to keep this false. |
| [config.startReactive] | <code>boolean</code> | <code>true</code> | Not implemented just yet. |

**Example**  
```js
// senal<object>
const senalObject = senal({x: 5});
tada(() => {
    if (senalObject.x > 5) {
         // runs when senal object set above 5;
    }
});
sendObject.x = 10; // reacts the tada.
```
**Example**  
```js
// senal<array>
// This is still experimental, and may change at moments notice.
const senalArray = senal(["fun", "sun"], {arrayToObject: true});
tada(() => {
   senalArray[10]; // using a getter of an index,
                   // all array indices from 0 to 10 will be reactive here.

});

senalArray.push("boo");      // This will react
senalArray[0] = "boo";       // This will react
senalArray[11] = "ghost";    // No, because the above tada doesn't react to anything above 10;
```
**Example**  
```js
// senal<function>
const senalFunction = senal((x) => x + "!!!");
let message;
let count = 0;
tada((inciter) => {
     // This tada starts off as 'initial' inciter but when the senal<function> is invoked
     // the tada enters the 'invocation' inciter. Once the invocation step is over,
     // it returns back to 'initial' inciter.

     count++; // be cautious of side effects, this will be 2, (initial and invocation);

    if (inciter.isInvocation) {
         // These invocation gates intercept the function handling
         // Not using one of these gates  before end of tada
         // will result in the senalFunction running as normal.

         // This will accept the invocation but change the first argument.
         inciter.accept("Coleslaw is disgusting");
         // This will use a different function for invocation
         inciter.instead((...args) => "Coleslaw is disgusting!!!", ...replacementArgs);
         // This will not run any function and supply your own return value
         inciter.shim("Coleslaw is disgusting!!!");
         // You could throw here, and the tada will error and the whole thing comes down.
    }

    // instead of the if statement you could do this as only the invocation inciter
    // will have the gates. (custom gates or custom invocation inciters not yet supported)
    inciter.accept?.("coleslaw is disgusting!!!");

    // This will go into the invocation step.
    // but not reinvoke during the invocation step.
    message = senalFunction("Coleslaw is good...");

    // Be warned. During invocation step.... message === undefined so if you have
    // any logic that handles the message, check for undefined.
    // Don't care if this is bad practice, I used this concept in other languages and makes
    // perfect sense to me.
    // if message truthy continue into the if statement . Only necessary if there are side-effects
    // like this message here.
    if (message = senalFunction("Coleslaw is good...")) {
         // Do message related stuff.
    }

    // Then come out back to the original incite
    message === "Coleslaw is disgusting!!!";

});
```
