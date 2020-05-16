# advanced-promises
Advanced promise types for handling cancellation and aborting.
Package has no external dependencies.

## Installation

Yarn

```shell script
yarn add advanced-promises
```

Npm

```shell script
npm add --save advanced-promises
```

## Examples

### Cancellable Promises
A cancellable promise allows you to stop the promise from ever resolving or rejecting.

Example:
        
    import { Timeout } from 'advanced-promises';
        
    // Construct a timeout for 1 second
    const timeout = new Timeout(1000);
    
    // Cancel the timeout
    timeout.cancel();
    
    // This will never resolve
    await timeout;  

### Abortable Promises
An abortable promise provides an API for the caller to request an early abort from the callee.
The callee can register handlers which will get run if the promise is aborted.

Example:

    import { Abortable } from 'advanced-promises';

    const abortable = new Abortable((resolve, reject, aapi) => {
        //.. start long running code ..
        
        aapi.on(async () => {
            //.. cancel long running code ..
        });
        
        //.. wait for long running code ...
        new Timeout(50).then(() => {
            resolve('real result');
        });
    });
    
    // request an abort and wait until handlers have run
    const res = await abortable.abortWith({ resolve: 'my value'});
    
    // will resolve (or reject) according to the provided input
    assert(res === 'my value');
    
    // wait for the wrapped promise to complete
    // EcmaScript has no facility for forcefully terminating a promise early
    // It's often best to wait for the internal promise
    const realRes = await abortable.promise;
    assert(realRes === 'real result');

### Deconstructed Promise
It is often useful to define the resolve/reject semantics of a promise outside of the executor function.
This promise type provides takes no executor and instead provides resolve/reject handlers as instance properties.

Example:

    import { Deconstructed } from 'advanced-promises';

    const deconstructed = new Deconstructed();
    
    deconstructed.resolve('my value');
    
    const res = await deconstructed;
    
    assert(res === 'my value');

### Detailed API documentation
See [Advanced Promise](https://whenderson.github.io/advanced-promises/) for detailed API documentation