/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

type Fn<T> = () => Promise<T> | T;

export default class CriticalSection {
  #busy = false;
  #queue: Array<() => Promise<void>> = [];

  async #kickOff() {
    if (this.#busy) {
      return;
    }

    this.#busy = true;

    try {
      while (this.#queue.length) {
        // Force-casting because we know there must be one item in the queue.
        const fn = this.#queue.shift() as () => Promise<void>;

        try {
          await fn();
          // Intentionally ignore error happened in the critical section for defensive programming.
          // The error is caught/captured by enter(), it should not throw here.
          // eslint-disable-next-line no-empty
        } catch (error) {}
      }
    } finally {
      this.#busy = false;
    }
  }

  public enter<T>(fn: Fn<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.#queue.push(async () => {
        try {
          resolve(await fn());
        } catch (error) {
          reject(error);
        }
      });

      // Intentionally calling async function synchronously and ignore its result.
      this.#kickOff();
    });
  }
}
