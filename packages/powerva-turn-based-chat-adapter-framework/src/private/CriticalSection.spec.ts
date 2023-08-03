/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import DeferredPromise from '../DeferredPromise';

import CriticalSection from './CriticalSection';

test('should enter critical section', async () => {
  // GIVEN: A critical section.
  const criticalSection = new CriticalSection();

  // ---

  // WHEN: Call enter().
  const pause = new DeferredPromise<void>();
  const fn1 = jest.fn(async () => {
    await pause.promise;

    return 1;
  });

  const promise1 = criticalSection.enter(fn1);

  // THEN: Should call the function.
  expect(fn1).toBeCalledTimes(1);

  // ---

  // WHEN: Resume.
  pause.resolve();

  // THEN: Should return value.
  await expect(promise1).resolves.toBe(1);

  // ---

  // WHEN: Call enter() twice.
  const fn2 = jest.fn(() => 2);
  const fn3 = jest.fn(() => 3);

  const promise2 = criticalSection.enter(fn2);
  const promise3 = criticalSection.enter(fn3);

  // THEN: Should return values.
  expect(fn2).toBeCalledTimes(1);
  await expect(promise2).resolves.toBe(2);

  expect(fn3).toBeCalledTimes(1);
  await expect(promise3).resolves.toBe(3);
});

test('should catch exception inside critical section', async () => {
  // GIVEN: A critical section.
  const criticalSection = new CriticalSection();

  // ---

  // WHEN: Call enter().
  const fn1 = jest.fn(async () => {
    throw new Error('artificial');
  });

  const promise1 = criticalSection.enter(fn1);

  // THEN: Should call the function.
  expect(fn1).toBeCalledTimes(1);
  await expect(promise1).rejects.toThrow('artificial');

  // ---

  // WHEN: Call enter() again.
  const fn2 = jest.fn(() => 2);
  const promise2 = criticalSection.enter(fn2);

  // THEN: Should return the value.
  expect(fn2).toBeCalledTimes(1);
  await expect(promise2).resolves.toBe(2);
});
