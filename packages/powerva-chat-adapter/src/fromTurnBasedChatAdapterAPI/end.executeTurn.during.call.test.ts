/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';
// TODO: When Jest support named export, we should shorten the path.
import { MockObserver } from 'powerva-chat-adapter-test-util';
import { DeferredPromise, ExecuteTurnContinuationAction, sleep } from 'powerva-turn-based-chat-adapter-framework';

import fromTurnBasedChatAdapterAPI from '../../src/fromTurnBasedChatAdapterAPI';

import createActivity from './private/createActivity';
import mockAPI from './private/mockAPI';

const SLEEP_INTERVAL = 10;

test('end() while executeTurn() should stop everything', async () => {
  const {
    api,
    mock: { executeTurn, startNewConversation }
  } = mockAPI();

  // GIVEN: A chat adapter using ConversationTestApi.
  const adapter = fromTurnBasedChatAdapterAPI(api);

  // ---

  // GIVEN: Implementation of startNewConversation().
  const pauseExecuteTurn = new DeferredPromise<never>();

  startNewConversation.mockImplementationOnce(() =>
    Promise.resolve({
      action: ExecuteTurnContinuationAction.Waiting,
      activities: [],
      conversationId: 'c-00001'
    })
  );

  executeTurn.mockImplementationOnce(async () => {
    await pauseExecuteTurn.promise;

    throw new Error('should not resolve');
  });

  // WHEN: Connect.
  const activityObserver = new MockObserver<Activity>();
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);
  adapter.activity$.subscribe(activityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should call startNewConversation().
  expect(startNewConversation).toBeCalledTimes(1);
  expect(startNewConversation).toHaveBeenNthCalledWith(
    1,
    true,
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );

  // ---

  // WHEN: Call postActivity().
  const postActivityObserver = new MockObserver();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should call executeTurn();
  expect(executeTurn).toBeCalledTimes(1);
  expect(executeTurn).toHaveBeenNthCalledWith(
    1,
    'c-00001',
    expect.objectContaining({ text: 'Aloha!' }),
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );

  // THEN: Should observe nothing.
  expect(postActivityObserver).toHaveProperty('observations', [['start', expect.any(Object)]]);

  // ---

  // WHEN: Call end().
  adapter.end();
  await sleep(SLEEP_INTERVAL);

  // THEN: Should signal abort.
  expect(executeTurn.mock.calls[0][2]).toHaveProperty('signal.aborted', true);

  // THEN: Should observe error.
  expect(postActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', expect.any(Error)]
  ]);

  expect(() => {
    throw postActivityObserver.observations[1][1];
  }).toThrow('closed');

  // THEN: Should observe activity complete.
  expect(activityObserver).toHaveProperty('observations', [['start', expect.any(Object)], ['complete']]);

  // THEN: Should observe connection status ended.
  expect(connectionStatusObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Connecting],
    ['next', ConnectionStatus.Online],
    ['next', ConnectionStatus.Ended],
    ['complete']
  ]);

  // ---

  // WHEN: Call postActivity().
  const anotherPostActivityObserver = new MockObserver();

  adapter.postActivity(createActivity('Aloha!')).subscribe(anotherPostActivityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should not resolve postActivity().
  expect(anotherPostActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', expect.any(Error)]
  ]);

  expect(() => {
    throw anotherPostActivityObserver.observations[1][1];
  }).toThrow('closed');
});
