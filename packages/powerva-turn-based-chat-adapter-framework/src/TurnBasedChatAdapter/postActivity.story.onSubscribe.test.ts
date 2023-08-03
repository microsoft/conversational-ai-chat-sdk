/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';
import { MockObserver } from 'powerva-chat-adapter-test-util';

import sleep from '../sleep';
import TestCanvasChatAdapter from '../TurnBasedChatAdapter';

import createActivity from './private/createActivity';

import type { TurnBasedChatIteratorClient } from '../types/TurnBasedChatIteratorClient';

type Execute = TurnBasedChatIteratorClient['execute'];
type StartConversation = ConstructorParameters<typeof TestCanvasChatAdapter>[0];

const SLEEP_INTERVAL = 10;

test('postActivity() should only call execute() when subscribed', async () => {
  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>(activity => ({
    activities: (async function* () {
      yield [{ ...activity, id: 'a-00001' }];
    })(),
    activityID: Promise.resolve('a-00001')
  }));

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => ({
    execute,
    initialActivities: (async function* () {
      // Intentionally left blank.
    })()
  }));

  // GIVEN: A connected chat adapter.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const activityObserver = new MockObserver<Activity>();

  adapter.activity$.subscribe(activityObserver);
  await sleep(SLEEP_INTERVAL);

  // ---

  // WHEN: postActivity() is called without subscription
  const postActivityObservable = adapter.postActivity(createActivity('Aloha!'));
  await sleep(SLEEP_INTERVAL);

  // THEN: It should not call execute().
  expect(execute).toBeCalledTimes(0);

  // THEN: It should call startConversation.
  expect(startConversation).toHaveBeenCalledTimes(1);

  // ---

  // WHEN: Subscribe to the observable returned from postActivity() call multiple times.
  const postActivityObserver = new MockObserver<string>();
  const anotherPostActivityObserver = new MockObserver<string>();
  postActivityObservable.subscribe(postActivityObserver);
  postActivityObservable.subscribe(anotherPostActivityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: It should call execute() once.
  expect(execute).toBeCalledTimes(1);

  // THEN: It should resolve the observation for both postActivity() call.
  expect(postActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 'a-00001'],
    ['complete']
  ]);

  expect(anotherPostActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 'a-00001'],
    ['complete']
  ]);

  // THEN: It should echo back the activity.
  expect(activityObserver.observations).toEqual([
    ['start', expect.any(Object)],
    ['next', expect.objectContaining({ id: 'a-00001', text: 'Aloha!' })]
  ]);
});
