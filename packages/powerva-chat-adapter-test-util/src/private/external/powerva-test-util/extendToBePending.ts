/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

declare global {
  // Jest uses namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // Bug in ESLint. This is module augmentation, even unused, they must be specified.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types
    interface Matchers<R, T = {}> {
      toBePending(): Promise<CustomMatcherResult>;
    }
  }
}

const toBePending: jest.CustomMatcher = async function (received: Promise<unknown>): Promise<jest.CustomMatcherResult> {
  return await Promise.race([
    new Promise(resolve => setTimeout(resolve, 0)).then(() => ({
      message: () => 'expect promise to be pending',
      pass: true
    })),
    received.then(
      () => ({
        message: () => 'expect promise not to be resolved',
        pass: false
      }),
      () => ({
        message: () => 'expect promise not to be rejected',
        pass: false
      })
    )
  ]);
};

export default function extendToBePending() {
  expect.extend({ toBePending });
}
