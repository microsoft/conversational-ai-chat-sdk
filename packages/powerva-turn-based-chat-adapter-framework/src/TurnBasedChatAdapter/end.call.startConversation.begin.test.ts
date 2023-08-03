/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';
import { MockObserver } from 'powerva-chat-adapter-test-util';

import sleep from '../sleep';
import TestCanvasChatAdapter from '../TurnBasedChatAdapter';

import createActivity from './private/createActivity';

import type { TurnBasedChatIteratorClient } from '../types/TurnBasedChatIteratorClient';

type Execute = TurnBasedChatIteratorClient['execute'];
type StartConversation = ConstructorParameters<typeof TestCanvasChatAdapter>[0];

const SLEEP_INTERVAL = 10;

test('end() before startConversation() begin should stop everything', async () => {
  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>();

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => ({
    execute,
    initialActivities: (async function* () {
      yield [createActivity('0')];
    })()
  }));

  // GIVEN: A chat adapter with pending postActivity().
  const adapter = new TestCanvasChatAdapter(startConversation);
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();
  const postActivityObserver = new MockObserver<string>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);
  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);

  // WHEN: Ended.
  adapter.end();
  await sleep(SLEEP_INTERVAL);

  // THEN: Connection status should turn from "uninitialized" to "ended".
  expect(connectionStatusObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Ended],
    ['complete']
  ]);

  // THEN: The postActivity() call should reject.
  expect(postActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', expect.any(Error)]
  ]);

  expect(() => {
    throw postActivityObserver.observations[1][1];
  }).toThrow('closed');

  // ---

  // WHEN: Subscribe to activity observable
  const activityObserver = new MockObserver<Activity>();

  adapter.activity$.subscribe(activityObserver);

  // THEN: Should complete the activity observable.
  expect(activityObserver.observations).toEqual([['start', expect.any(Object)], ['complete']]);

  // THEN: Should not call startConversation().
  expect(startConversation).toBeCalledTimes(0);

  // ---

  // WHEN: Call postActivity() again.
  const anotherPostActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Hello!')).subscribe(anotherPostActivityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should reject.
  expect(anotherPostActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', expect.any(Error)]
  ]);

  // ---

  // WHEN: Subscribe to connection status observable.
  const anotherConnectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(anotherConnectionStatusObserver);

  // THEN: Connection status should turn from "uninitialized" to "ended".
  expect(anotherConnectionStatusObserver.observations).toEqual([
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Ended],
    ['complete']
  ]);
});
