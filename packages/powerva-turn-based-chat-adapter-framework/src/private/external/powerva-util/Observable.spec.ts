/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import Observable, { type SubscriberFunction } from './Observable';

type SubscriptionObserver<T> = Parameters<SubscriberFunction<T>>[0];

test('should use CoreJS', () => {
  // Simple functional test to make sure it is wired up to CoreJS.

  const unsubscribe = jest.fn<void, []>();
  const subscriber = jest.fn<() => void, [SubscriptionObserver<number>]>().mockImplementation(() => unsubscribe);
  const next = jest.fn<void, [number]>();

  const subscription = new Observable<number>(subscriber).subscribe({ next });

  expect(subscriber).toBeCalledTimes(1);
  expect(next).toBeCalledTimes(0);

  subscriber.mock.calls[0][0].next(123);

  expect(next).toBeCalledTimes(1);
  expect(next).toHaveBeenNthCalledWith(1, 123);
  expect(unsubscribe).toBeCalledTimes(0);

  subscription.unsubscribe();

  expect(unsubscribe).toBeCalledTimes(1);
});
