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

test('postActivity() should stop after 100 turns', async () => {
  const pause = new DeferredPromise<void>();
  const iterate = jest.fn();

  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>(activity => ({
    activities: (async function* () {
      for (let index = 0; index < 100; index++) {
        iterate();

        yield index ? [] : [{ ...activity, id: 'a-00001' }];
      }

      await pause.promise;

      yield [createActivity('1')];
    })(),
    activityID: Promise.resolve('a-00001')
  }));

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => ({
    execute,
    initialActivities: (async function* () {
      // Intentionally left blank.
    })()
  }));

  // GIVEN: A chat adapter.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const activityObserver = new MockObserver<Activity>();
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);
  adapter.activity$.subscribe(activityObserver);
  await sleep(SLEEP_INTERVAL);

  // ---

  // WHEN: postActivity() is called.
  const postActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should call execute() and iterate 100 times.
  expect(iterate).toBeCalledTimes(100);

  // THEN: Should resolve the postActivity() call.
  expect(postActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 'a-00001'],
    ['complete']
  ]);

  // THEN: Should observe echo back.
  expect(activityObserver.observations).toEqual([
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

  // WHEN: Iterate for 101st time.
  pause.resolve();
  await sleep(SLEEP_INTERVAL);

  // THEN: The adapter should end.
  expect(connectionStatusObserver.observations).toEqual([
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Connecting],
    ['next', ConnectionStatus.Online],
    ['next', ConnectionStatus.FailedToConnect],
    ['complete']
  ]);

  // THEN: Activity should observe complete.
  expect(activityObserver.observations).toEqual([
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

  adapter.postActivity(createActivity('Hello!')).subscribe(anotherPostActivityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should reject with error "too many turns".
  expect(anotherPostActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', expect.any(Error)]
  ]);

  expect(() => {
    throw anotherPostActivityObserver.observations[1][1];
  }).toThrow('Too many turns');
});
