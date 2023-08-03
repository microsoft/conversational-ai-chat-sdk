/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { MockObserver } from 'powerva-chat-adapter-test-util';

import Observable from './Observable';

test('should start and complete', () => {
  // GIVEN: An observable without any values.
  const observable = Observable.from([]);
  const observer = new MockObserver();

  // WHEN: Subscribe to observable.
  observable.subscribe(observer);

  // THEN: start and complete should be observed.
  expect(observer).toHaveProperty('observations', [['start', expect.any(Object)], ['complete']]);
});

test('should emit iterables', () => {
  // GIVEN: An observable without any values.
  const observable = Observable.from([1, 2, 3]);
  const observer = new MockObserver();

  // WHEN: Subscribe to observable.
  observable.subscribe(observer);

  // THEN: Should observe start, next, and complete.
  expect(observer).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 1],
    ['next', 2],
    ['next', 3],
    ['complete']
  ]);
});
