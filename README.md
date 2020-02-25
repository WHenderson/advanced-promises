# advanced-promise
Advanced promise types for handling cancellation and aborting with no external dependencies.

## CancellablePromiseLike
A cancellable promise allows you to stop the promise from ever resolving or rejecting.

Example:
        
    const timeout = new Timeout(1000);
    timeout.cancel();
    await promise; // This will never resolve 

## AbortablePromiseLike
An abortable promise provides an API for aborting a promise and also for asynchronously handling an abort.
Aborting a promise will run any abort handlers and immediately resolve.

Example:

    const promise = new Abortable((resolve, reject, onAbort) => {
        //.. start long running code ..
        
        onAbort(async () => {
            //.. cancel long running code ..
        });
        
        //.. wait for long running code ...
    );
    
    promise.abortWith({ resolve: 'my value'});
    
    await promise; // will resolve to 'my value'

## Installation

Yarn
```shell script
yarn add advanced-promises
```

Npm
```shell script
npm add --save advanced-promises
```

## API

### Abortable

Creating
* [Abortable (constructor)](#abortable-constructor)
* [Abortable.fromAsync](#abortablefromasync)
* [Abortable.fromPromise](#abortablefrompromise)
* [Abortable.resolve](#abortableresolve)
* [Abortable.reject](#abortablereject)

Combining
* [Abortable.prototype.withTimeout](#abortableprototypewithtimeout)
* [Abortable.prototype.withAutoAbort](#abortableprototypewithautoabort)

Resolving
* [Abortable.this.abortWith](#abortablethisabortwith)
* [Abortable.this.abort](#abortablethisabort)
* [Abortable.this.promise](#abortablethispromise)
* [Abortable.this.aapi](#abortablethisaapi)

### AbortApi

* AbortApi.this.on
* AbortApi.this.off
* AbortApi.this.state
* AbortApi.prototype.withHandler

## Timeout

Creating
* Timeout (constructor)
* Timeout.resolve
* Timeout.reject

Combining
* Timeout.prototype.withAutoCancel
* Timeout.prototype.withAutoAbort

Resolving
* Timeout.this.abortWith
* Timeout.this.aapi
* Timeout.this.cancel

## Process (extends Abortable)

Creating
* Process (constructor)

Accessing
* Process.this.process

## Detailed

### Abortable (constructor)

```typescript
new Abortable(executor: (resolve, reject, aapi) => void)
```

**Parameters**
* `executor`

### Abortable.fromAsync

```typescript
Abortable.fromAsync<T>(executor: (aapi: AbortApi) => T | PromiseLike<T>): Abortable<T>
```

**Parameters**
* `executor`

### Abortable.fromPromise

```typescript
Abortable.fromPromise<T>(promise: T | PromiseLike<T>): Abortable<T>
```

**Parameters**
* `promise`


### Abortable.resolve

```typescript
Abortable.resolve() : Abortable<void>
Abortable.resolve<T>(value?: T | PromiseLike<T>) : Abortable<T>
```

**Parameters**
* `value`

### Abortable.reject

```typescript
Abortable.reject<T = never>(reason?: any) : Abortable<T>
```

**Parameters**
* `reason`

### Abortable.prototype.withTimeout

```typescript
Abortable.withTimeout(timeout: Timeout<T>): Abortable<T>;
Abortable.withTimeout(duration: number, response?: Response<T>): Abortable<T>;
```

**Paramters**
* `timeout`
* `duration`
* `response`

### Abortable.prototype.withAutoAbort
### Abortable.this.abortWith
### Abortable.this.abort
### Abortable.this.promise
### Abortable.this.aapi

