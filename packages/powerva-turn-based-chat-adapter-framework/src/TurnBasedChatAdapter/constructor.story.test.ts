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

test('Constructor should work', async () => {
  const pause = new DeferredPromise<void>();

  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>();

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => {
    await pause.promise;

    return {
      execute,
      initialActivities: (async function* () {
        yield [createActivity('1'), createActivity('2')];
        yield [createActivity('3')];
      })()
    };
  });

  // GIVEN: A connected chat adapter.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);
  await sleep(SLEEP_INTERVAL);

  // ---

  // WHEN: Connect.
  const activityObserver = new MockObserver<Activity>();

  adapter.activity$.subscribe(activityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should call startConversation().
  expect(startConversation).toBeCalledTimes(1);

  // THEN: Connection status should observe "uninitialized", and "connecting".
  expect(connectionStatusObserver.observations).toEqual([
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Connecting]
  ]);

  // ---

  // WHEN: Resume.
  pause.resolve();
  await sleep(SLEEP_INTERVAL);

  // THEN: Connection status should observe "online".
  expect(connectionStatusObserver.observations).toEqual([
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Connecting],
    ['next', ConnectionStatus.Online]
  ]);

  // THEN: Activity should observe initial activities.
  expect(activityObserver.observations).toEqual([
    ['start', expect.any(Object)],
    ['next', expect.objectContaining({ text: '1' })],
    ['next', expect.objectContaining({ text: '2' })],
    ['next', expect.objectContaining({ text: '3' })]
  ]);
});
