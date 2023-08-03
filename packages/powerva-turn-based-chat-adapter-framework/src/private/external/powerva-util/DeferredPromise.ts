/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

/* eslint max-classes-per-file: "off" */

type RejectCallback = (reason?: unknown) => void;
type ResolveCallback<T> = (value: T | PromiseLike<T>) => void;

interface DeferredPromiseConstructor {
  readonly prototype: DeferredPromise<unknown>;
  new <T>(): DeferredPromise<T>;

  reject<T>(reason?: unknown): DeferredPromise<T>;
}

interface DeferredPromise<T> {
  get promise(): Promise<T>;

  reject(reason?: unknown): void;
  resolve(value: T | PromiseLike<T>): void;
}

class DeferredPromiseImpl<T> implements DeferredPromise<T> {
  constructor() {
    let promiseReject: RejectCallback | undefined;
    let promiseResolve: ResolveCallback<T> | undefined;

    this.#promise = new Promise<T>((resolve, reject) => {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    if (!promiseReject || !promiseResolve) {
      throw new Error();
    }

    this.#reject = promiseReject;
    this.#resolve = promiseResolve;
  }

  #promise: Promise<T>;
  #reject: RejectCallback;
  #resolve: ResolveCallback<T>;

  public get promise(): Promise<T> {
    return this.#promise;
  }

  public reject(reason?: unknown): void {
    if (!(this instanceof DeferredPromiseImpl)) {
      throw new Error('reject() cannot be called on a non-DeferredPromise object.');
    }

    this.#reject(reason);
  }

  public resolve(value: T | PromiseLike<T>): void {
    if (!(this instanceof DeferredPromiseImpl)) {
      throw new Error('resolve() cannot be called on a non-DeferredPromise object.');
    }

    this.#resolve(value);
  }

  public static reject<T>(reason?: unknown): DeferredPromise<T> {
    return new RejectedDeferredPromise(reason);
  }
}

class RejectedDeferredPromise<T> implements DeferredPromise<T> {
  constructor(reason?: unknown) {
    this.#promise = Promise.reject(reason);
  }

  #promise: Promise<T>;

  public get promise(): Promise<T> {
    return this.#promise;
  }

  public reject() {
    // Intentionally left blank.
  }

  public resolve() {
    // Intentionally left blank.
  }
}

// This variable name "DeferredPromise" must match the interface name "DeferredPromise".
// This is a technique for creating static interface.
// eslint-disable-next-line @typescript-eslint/no-redeclare
const DeferredPromise: DeferredPromiseConstructor = DeferredPromiseImpl as DeferredPromiseConstructor;

export default DeferredPromise;
