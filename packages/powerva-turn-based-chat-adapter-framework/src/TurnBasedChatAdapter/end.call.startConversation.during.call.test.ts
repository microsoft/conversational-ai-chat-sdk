/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';
import { MockObserver } from 'powerva-chat-adapter-test-util';

import DeferredPromise from '../DeferredPromise';
import sleep from '../sleep';
import TestCanvasChatAdapter from '../TurnBasedChatAdapter';

import createActivity from './private/createActivity';

type StartConversation = ConstructorParameters<typeof TestCanvasChatAdapter>[0];

const SLEEP_INTERVAL = 10;

test('end() during call to startConversation() should stop everything', async () => {
  const pause = new DeferredPromise<void>();

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => {
    await pause.promise;

    throw new Error('artificial error');
  });

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

  // THEN: Should observe uninitialized and connecting.
  expect(connectionStatusObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Connecting]
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

  // THEN: Should observe ended.
  expect(connectionStatusObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Connecting],
    ['next', ConnectionStatus.Ended],
    ['complete']
  ]);

  // THEN: Activity observable should be completed.
  expect(activityObserver).toHaveProperty('observations', [['start', expect.any(Object)], ['complete']]);
});
