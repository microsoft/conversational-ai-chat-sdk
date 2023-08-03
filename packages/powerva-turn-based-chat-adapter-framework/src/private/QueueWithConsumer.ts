/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import CriticalSection from './CriticalSection';

type Consumer<T> = (value: T) => Promise<void>;

type QueueWithConsumerOptions<T> = {
  // "error" is actually "any".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorCallback?: (value: T, error: any) => void;
};

export default class QueueWithConsumer<T> {
  constructor(consumer: Consumer<T>, { errorCallback }: QueueWithConsumerOptions<T> = {}) {
    this.#consumer = consumer;
    this.#criticalSection = new CriticalSection();
    this.#errorCallback = errorCallback;
  }

  #consumer: Consumer<T>;
  #criticalSection: CriticalSection;
  // "error" is actually "any".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #errorCallback: ((value: T, error: any) => void) | undefined;

  public push(value: T): void {
    this.#criticalSection.enter(async () => {
      try {
        await this.#consumer(value);
      } catch (error) {
        this.#errorCallback?.(value, error);
      }
    });
  }
}
