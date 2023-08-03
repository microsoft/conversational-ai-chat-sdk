/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { extendToBePending } from 'powerva-chat-adapter-test-util';

import AbortPromise from './AbortPromise';

beforeAll(extendToBePending);

describe('AbortPromise', () => {
  let abortPromise: AbortPromise;
  let onAbort: ReturnType<typeof jest.fn<void, [Event]>>;

  // GIVEN: An AbortPromise.
  beforeEach(async () => {
    onAbort = jest.fn();

    abortPromise = new AbortPromise();
    abortPromise.signal.addEventListener('abort', onAbort);

    await expect(abortPromise.promise).toBePending();
  });

  test('should reject promise without a reason', async () => {
    // WHEN: Call abort() without specifying a reason.
    abortPromise.abort();

    // THEN: It should reject.
    await expect(abortPromise.promise).rejects.toBe(undefined);
  });

  test('should reject promise with a reason', async () => {
    // WHEN: Call abort() without specifying a reason.
    abortPromise.abort(new Error('artificial'));

    // THEN: It should reject.
    await expect(() => abortPromise.promise).rejects.toThrow('artificial');
  });

  test('should signal', async () => {
    // WHEN: Call abort().
    abortPromise.abort();

    // THEN: It should signal.
    expect(onAbort).toHaveBeenCalledTimes(1);
  });
});
