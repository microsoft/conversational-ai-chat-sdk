/** @jest-environment jsdom */

/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { waitFor } from '@testing-library/dom';

import DeferredPromise from '../DeferredPromise';

import QueueWithConsumer from './QueueWithConsumer';

test('should push items to its consumer', async () => {
  // GIVEN: A consumer queue.
  const consumer = jest.fn();
  const queue = new QueueWithConsumer<number>(consumer);

  // WHEN: Call push().
  queue.push(1);

  // THEN: Consumer should be called.
  expect(consumer).toBeCalledTimes(1);
  expect(consumer).toHaveBeenNthCalledWith(1, 1);

  // WHEN: Call push() again twice.
  queue.push(2);
  queue.push(3);

  // THEN: Consumer should be called 3 times.
  await waitFor(() => {
    expect(consumer).toBeCalledTimes(3);
  });
  expect(consumer).toHaveBeenNthCalledWith(2, 2);
  expect(consumer).toHaveBeenNthCalledWith(3, 3);
});

test('should queue items to its busy consumer', async () => {
  // GIVEN: A consumer queue with a pulsing consumer.
  const deferreds = [new DeferredPromise<void>(), new DeferredPromise<void>()];
  const consumer = jest.fn(index => deferreds[index - 1].promise);
  const queue = new QueueWithConsumer<number>(consumer);

  // WHEN: Call push() 3 times successively.
  queue.push(1);
  queue.push(2);
  queue.push(3);

  // THEN: The consumer should be called once.
  await waitFor(() => expect(consumer).toBeCalledTimes(1));

  // WHEN: Pulse the consumer.
  deferreds[0].resolve();

  // THEN: The consumer should be called twice.
  await waitFor(() => expect(consumer).toBeCalledTimes(2));

  // WHEN: Pulse the consumer again.
  deferreds[1].resolve();

  // THEN: The consumer should be called 3 times.
  await waitFor(() => expect(consumer).toBeCalledTimes(3));
});

test('should call errorCallback when error and continue processing', async () => {
  // GIVEN: A consumer queue with a pulsing consumer.
  const deferreds = [new DeferredPromise<void>(), new DeferredPromise<void>()];
  const consumer = jest.fn(index => deferreds[index - 1].promise);
  const errorCallback = jest.fn();
  const queue = new QueueWithConsumer<number>(consumer, { errorCallback });

  // WHEN: Call push() 3 times successively.
  queue.push(1);
  queue.push(2);
  queue.push(3);

  // THEN: The consumer should be called once.
  await waitFor(() => expect(consumer).toBeCalledTimes(1));

  // WHEN: The consumer reject.
  deferreds[0].reject('Aloha!');

  // THEN: The consumer should be called twice.
  await waitFor(() => expect(consumer).toBeCalledTimes(2));

  // THEN: The "errorCallback" should be called.
  expect(errorCallback).toBeCalledTimes(1);
  expect(errorCallback).toBeCalledWith(1, 'Aloha!');
});
