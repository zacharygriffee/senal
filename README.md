# Señal

> I don't know much spanish, it's just harder to find good npm names these days.
---

### API Documentation

- [Senal](https://github.com/zacharygriffee/senal/blob/main/docs/senal-api.md)
  - [Ignore](https://github.com/zacharygriffee/senal/blob/main/docs/ignore-api.md)
- [Tada](https://github.com/zacharygriffee/senal/blob/main/docs/tada-api.md)
  - [Pause](https://github.com/zacharygriffee/senal/blob/main/docs/pause-api.md)
- [Inciter](https://github.com/zacharygriffee/senal/blob/main/docs/inciter-api.md)

## Installation
First, we need to install `senal`:

```bash
    npm install --save senal
```

## Import

```js
import { 
    senal,                  // Observe an object and its nested objects   (observable)
    tada,                   // Reacts to changes of observables           (observer)
    //dispose (deprecated), // Dispose | Complete a tada.    
    ignore,                 // Wrap objects that should not be observed ever
    pause,                  // Pause a computed tada and resume later.
    inciter                 // Wrap whatever to incite a tada with.
} from 'senal';
```


## License
This project is licensed under [MIT](LICENSE.md).
More info in the [LICENSE](LICENSE.md) file.
