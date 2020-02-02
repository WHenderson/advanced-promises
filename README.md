# advanced-promise
Advanced promise types

## CancellablePromise
A cancellable promise allows you to stop the promise from ever resolving or rejecting.

Example:
        
    const promise = new CancellableTimeout(1000);
    promise.cancel();
    await promise; // This will never resolve 

## AbortablePromise
An abortable promise provides an api for aborting a promise with custom handlers.
An aborted promise may still run, but it will resolve/reject as requested through the abort api

Example:

    const promise = new AbortablePromise((resolve, reject, onAbort) => {
        .. start running code ..
        
        onAbort(async () => {
            // cancel long running code
        });
        
        .. wait for long running code ...
    );
    
    promise.abortWithResolve('my value');
    
    await promise; // will resolve to 'my value'



 
