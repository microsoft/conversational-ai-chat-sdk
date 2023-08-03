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

test('postActivity() should reject when execute() throw', async () => {
  const pause = new DeferredPromise<void>();

  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>(activity => ({
    activities: (async function* () {
      yield [{ ...activity, id: 'a-00001' }];
    })(),
    activityID: (async function () {
      await pause.promise;

      throw new Error('artificial');
    })()
  }));

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(() =>
    Promise.resolve({
      execute,
      initialActivities: (async function* () {
        // Intentionally left blank.
      })()
    })
  );

  // GIVEN: A connected chat adapter.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const activityObserver = new MockObserver<Activity>();
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);
  adapter.activity$.subscribe(activityObserver);
  await sleep(SLEEP_INTERVAL);

  // ---

  // WHEN: Call postActivity().
  const postActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should not observe anything yet.
  expect(postActivityObserver).toHaveProperty('observations', [['start', expect.any(Object)]]);

  // THEN: Activity should observe next.
  expect(activityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    [
      'next',
      expect.objectContaining({
        id: 'a-00001',
        text: 'Aloha!'
      })
    ]
  ]);

  // ---

  // WHEN: Resume.
  pause.resolve();
  await sleep(SLEEP_INTERVAL);

  // THEN: Should be rejected.
  expect(postActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', expect.any(Error)]
  ]);

  expect(() => {
    throw postActivityObserver.observations[1][1];
  }).toThrow('artificial');

  // THEN: Connection status should complete.
  expect(connectionStatusObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Connecting],
    ['next', ConnectionStatus.Online],
    ['next', ConnectionStatus.FailedToConnect],
    ['complete']
  ]);

  // THEN: Activity should observe complete.
  expect(activityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    [
      'next',
      expect.objectContaining({
        id: 'a-00001',
        text: 'Aloha!'
      })
    ],
    ['complete']
  ]);

  // ---

  // WHEN: Call postActivity() again.
  const anotherPostActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(anotherPostActivityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should be rejected with same error.
  expect(anotherPostActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', expect.any(Error)]
  ]);

  expect(() => {
    throw anotherPostActivityObserver.observations[1][1];
  }).toThrow('artificial');
});
