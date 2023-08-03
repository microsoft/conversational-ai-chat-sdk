/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import DeferredPromise from '../DeferredPromise';

export default class AbortPromise {
  constructor() {
    this.#abortController = new AbortController();
    this.#abortDeferred = new DeferredPromise();
  }

  #abortController: AbortController;
  #abortDeferred: DeferredPromise<never>;

  /**
   * Promise that will be rejected on abort.
   */
  public get promise(): Promise<never> {
    return this.#abortDeferred.promise;
  }

  public get signal(): AbortSignal {
    return this.#abortController.signal;
  }

  // "reason" is "error", which is any.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public abort(reason?: any) {
    this.#abortController.abort();
    this.#abortDeferred.reject(reason);
  }
}
