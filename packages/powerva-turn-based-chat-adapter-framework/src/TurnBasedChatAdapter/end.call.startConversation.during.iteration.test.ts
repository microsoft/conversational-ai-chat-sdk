/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';
import { MockObserver } from 'powerva-chat-adapter-test-util';

import DeferredPromise from '../DeferredPromise';
import sleep from '../sleep';
import TestCanvasChatAdapter from '../TurnBasedChatAdapter';

import createActivity from './private/createActivity';

import type { TurnBasedChatIteratorClient } from '../types/TurnBasedChatIteratorClient';

type Execute = TurnBasedChatIteratorClient['execute'];
type StartConversation = ConstructorParameters<typeof TestCanvasChatAdapter>[0];

const SLEEP_INTERVAL = 10;

test('end() during iteration of startConversation() should stop everything', async () => {
  const pause = new DeferredPromise<void>();

  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>();

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => ({
    execute,
    // For testing purpose.
    // eslint-disable-next-line require-yield
    initialActivities: (async function* () {
      await pause.promise;
    })()
  }));

  // GIVEN: A chat adapter with a pending postActivity.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const activityObserver = new MockObserver<Activity>();
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();
  const postActivityObserver = new MockObserver<string>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);
  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);

  // WHEN: Connect.
  adapter.activity$.subscribe(activityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: postActivity() should be pending.
  expect(postActivityObserver).toHaveProperty('observations', [['start', expect.any(Object)]]);

  // THEN: startConversation() should be called.
  expect(startConversation).toBeCalledTimes(1);

  // THEN: Connection status should observe uninitialized, connecting, and online.
  expect(connectionStatusObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Connecting],
    ['next', ConnectionStatus.Online]
  ]);

  // ---

  // WHEN: End.
  adapter.end();
  await sleep(SLEEP_INTERVAL);

  // THEN: postActivity() should be rejected.
  expect(postActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', expect.any(Object)]
  ]);

  expect(() => {
    throw postActivityObserver.observations[1][1];
  }).toThrow('closed');

  // THEN: Connection status should observe ended.
  expect(connectionStatusObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Connecting],
    ['next', ConnectionStatus.Online],
    ['next', ConnectionStatus.Ended],
    ['complete']
  ]);

  // THEN: Activity observable should be completed.
  expect(activityObserver).toHaveProperty('observations', [['start', expect.any(Object)], ['complete']]);
});
