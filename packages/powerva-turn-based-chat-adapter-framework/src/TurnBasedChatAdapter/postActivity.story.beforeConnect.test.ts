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

test('postActivity() before startConversation() should call execute() only after connected', async () => {
  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>(activity => ({
    activities: (async function* () {
      yield [{ ...activity, id: 'a-00001' }, createActivity('1')];
    })(),
    activityID: Promise.resolve('a-00001')
  }));

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => ({
    execute,
    initialActivities: (async function* () {
      yield [createActivity('0')];
    })()
  }));

  // GIVEN: A chat adapter.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const activityObserver = new MockObserver<Activity>();

  // ---

  // WHEN: postActivity() is called before connect.
  const postActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should not call execute().
  expect(execute).toBeCalledTimes(0);

  // THEN: Should not observe anything.
  expect(postActivityObserver).toHaveProperty('observations', [['start', expect.any(Object)]]);

  // ---

  // WHEN: Connect.
  adapter.activity$.subscribe(activityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should call startConversation().
  expect(startConversation).toHaveBeenCalledTimes(1);

  // THEN: Should call execute().
  expect(execute).toBeCalledTimes(1);

  // THEN: Should resolve the postActivity() call.
  expect(postActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 'a-00001'],
    ['complete']
  ]);

  // THEN: Should echo back the activity and the reply.
  expect(activityObserver.observations).toHaveLength(4);
  expect(activityObserver.observations).toEqual([
    ['start', expect.any(Object)],
    ['next', expect.objectContaining({ text: '0' })],
    ['next', expect.objectContaining({ id: 'a-00001', text: 'Aloha!' })],
    ['next', expect.objectContaining({ text: '1' })]
  ]);
});
