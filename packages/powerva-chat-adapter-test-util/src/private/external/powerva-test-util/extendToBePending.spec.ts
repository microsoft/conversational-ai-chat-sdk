/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import noop from 'lodash/noop';

import extendToBePending from './extendToBePending';

beforeAll(extendToBePending);

test('rejected promise should throw', () => expect(() => expect(Promise.reject()).toBePending()).rejects.toThrow());

test('resolved promise should throw', () => expect(() => expect(Promise.resolve()).toBePending()).rejects.toThrow());

test('pending promise should not throw', () => expect(new Promise(noop)).toBePending());

describe('negate', () => {
  test('rejected promise should not throw', () => expect(Promise.reject()).not.toBePending());
  test('resolved promise should not throw', () => expect(Promise.resolve()).not.toBePending());
  test('pending promise should throw', () =>
    expect(() => expect(new Promise(noop)).not.toBePending()).rejects.toThrow());
});
