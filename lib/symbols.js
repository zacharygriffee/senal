const prefix = "senal-"

// Senal symbols
// export const observeSymbol = Symbol.for(`${prefix}senal`);
export const ignored = Symbol.for(`${prefix}ig`);
export const reactive = Symbol.for(`${prefix}ra`);
export const invokable = Symbol.for(`${prefix}in`);

export const subscribe = Symbol();
export const notify = Symbol();
export const advertise = Symbol();

// Tada symbols
export const tadaSymbol = Symbol.for(`${prefix}tada`);
export const forkSymbol = Symbol();

// Inciter symbols
export const inciterSymbol = Symbol.for(`${prefix}incit`);
export const invoke = Symbol.for(`${prefix}inv`);
export const invoker = Symbol.for(`${prefix}invr`);