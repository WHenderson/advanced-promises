# advanced-promise
Advanced promise types for handling cancellation and aborting.
Package has no external dependencies.

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

## DeconstructedPromiseLike
A promise with the resolve/reject handlers made into properties of the instance

Example:

    const promise = new Deconstructed();
    
    promise.resolve('my value');
    
    await promise(); // will resolve to 'my value'

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

* [AbortApi.this.on](#abortapithison)
* [AbortApi.this.off](#abortapithisoff)
* [AbortApi.this.state](#abortapithisstate)
* [AbortApi.prototype.withHandler](#abortapiprototypewithhandler)

## Timeout

Creating
* [Timeout (constructor)](#timeout-constructor)
* [Timeout.resolve](#timeoutresolve)
* [Timeout.reject](#timeoutreject)
* [Timeout.infinite](#timeoutinfinite)
* [Timeout.INF](#)
* [Timeout.NUL](#)

Combining
* [Timeout.prototype.withAutoCancel](#timeoutprototypewithautocancel)
* [Timeout.prototype.withAutoAbort](#timeoutprototypewithautoabort)

Resolving
* [Timeout.this.abortWith](#timeoutthisabortwith)
* [Timeout.this.aapi](#timeoutthisaapi)
* [Timeout.this.cancel](#timeoutthiscancel)

Mutating
* [Timeout.reset](#)
* [Timeout.]

## Process (extends Abortable)

Creating
* Process (constructor)

Accessing
* Process.this.process

## Detailed

### Abortable

Internally, the Abortable uses two promises in a race condition. 

The user promise and the abort promise.

Additionally, when constructing the Abortable, the user promise is provided access to the AbortApi which allows it to attach handlers for dealing with an abort.   

### Abortable (constructor)

Create an Abortable using callbacks

```typescript
new Abortable(executor: (resolve, reject, aapi) => void)
```

**Parameters**
* `executor`

### Abortable.fromAsync

Create an Abortable using an async callback function

```typescript
Abortable.fromAsync<T>(executor: (aapi: AbortApi) => T | PromiseLike<T>): Abortable<T>
```

**Parameters**
* `executor`

### Abortable.fromPromise

Create an Abortable from a standard Promise

```typescript
Abortable.fromPromise<T>(promise: T | PromiseLike<T>): Abortable<T>
```

**Parameters**
* `promise`

### Abortable.resolve

Create a resolved Abortable promise

```typescript
Abortable.resolve() : Abortable<void>
Abortable.resolve<T>(value?: T | PromiseLike<T>) : Abortable<T>
```

**Parameters**
* `value`

### Abortable.reject

Create a rejected Abortable promise

```typescript
Abortable.reject<T = never>(reason?: any) : Abortable<T>
```

**Parameters**
* `reason`

### Abortable.prototype.withTimeout

Combine an Abortable promise with a timeout.
 
If the timeout is reached before the internal promise resolves, the Abortable promise is aborted with response.

```typescript
abortable.withTimeout(timeout: Timeout<T>): Abortable<T>;
abortable.withTimeout(duration: number, response?: Response<T>): Abortable<T>;
```

**Paramters**
* `timeout`
* `duration`
* `response`

### Abortable.prototype.withAutoAbort

Add a handler to automatically abort when the aapi is triggered.

```typescript
abortable.withAutoAbort(aapi: AbortApi, response?: Response<T>) => this
```

**Parameters**
* `aapi`
* `response`

### Abortable.this.abortWith

Abort with the provided response

```typescript
abortable.abortWith = (response?: Response<T>) => this
```

**Parameters**
* `response`

### Abortable.this.abort

Access the internal promise used for aborting.

Useful for waiting only on an abort.

```typescript
abortable.abort : Promise<T>
```


### Abortable.this.promise

Access the internal promise.

Useful for waiting on the internal promise, regardless of being aborted

```typescript
abortable.promise : Promise<T>
```

### Abortable.this.aapi

Access the AbortApi 

```typescript
abortable.aapi : AbortApi
```

### Timeout

The timeout is a Cancellable promise which resolves after the specified duration.
If the timeout is cancelled, the promise well never resolve (unless aborted).
If the timeout is 

### Timeout (constructor)

```typescript
new Timeout(duration: number, response?: Response<T>)
```

**Parameters**
* `duration`
* `response`

### Timeout.resolve

```typescript
Timeout.resolve() : Abortable<void>;
Timeout.resolve<T>(value?: T | PromiseLike<T>) : Abortable<T>;
```

**Parameters**
* `value`

### Timeout.reject

```typescript
Timeout.reject<T = never>(reason?: any) : Abortable<T>;
```

**Parameters**
* `reason`

**Parameters**

### Timeout.infinite

```typescript
Timeout.infinite() : Timeout<void>
```

### Timeout.prototype.withAutoCancel

```typescript

```

**Parameters**

### Timeout.prototype.withAutoAbort

```typescript

```

**Parameters**

### Timeout.this.abortWith

```typescript

```

**Parameters**

### Timeout.this.aapi

```typescript

```

**Parameters**

### Timeout.this.cancel

```typescript

```

**Parameters**

