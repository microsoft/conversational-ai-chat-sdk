/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import DeferredPromise from './DeferredPromise';

test('calling resolve() should resolve the promise', () => {
  const deferred = new DeferredPromise<number>();

  deferred.resolve(123);

  return expect(deferred.promise).resolves.toBe(123);
});

test('calling reject() should reject the promise', () => {
  const deferred = new DeferredPromise();

  deferred.reject(new Error('Aloha!'));

  return expect(deferred.promise).rejects.toThrow('Aloha!');
});

test('calling resolve() outside of DeferredPromise should throw', () => {
  const { resolve } = new DeferredPromise<void>();

  expect(() => resolve()).toThrow('resolve() cannot be called on a non-DeferredPromise object.');
});

test('calling reject() outside of DeferredPromise should throw', () => {
  const { reject } = new DeferredPromise<void>();

  expect(() => reject()).toThrow('reject() cannot be called on a non-DeferredPromise object.');
});
