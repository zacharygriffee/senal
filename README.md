# Señal

> I don't know much spanish, it's just harder to find good npm names these days.
---

### API Documentation

- [Senal](docs/senal-api.md)
  - [Ignore](docs/ignore-api.md)
- [Tada](docs/tada-api.md)
  - [Dispose](docs/dispose-api.md)
  - [Pause](docs/pause-api.md)
- [Inciter](docs/inciter-api.md)

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
    dispose,                // Dispose | Complete a tada.    
    ignore,                 // Wrap objects that should not be observed ever
    pause,                  // Pause a computed tada and resume later.
    inciter                 // Wrap whatever to incite a tada with.
} from 'senal';
```


## License
This project is licensed under [MIT](LICENSE.md).
More info in the [LICENSE](LICENSE.md) file.
