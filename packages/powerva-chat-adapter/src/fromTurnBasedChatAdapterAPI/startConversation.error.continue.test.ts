/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';
// TODO: When Jest support named export, we should shorten the path.
import { MockObserver } from 'powerva-chat-adapter-test-util';
import { ExecuteTurnContinuationAction, sleep } from 'powerva-turn-based-chat-adapter-framework';

import fromTurnBasedChatAdapterAPI from '../../src/fromTurnBasedChatAdapterAPI';

import createActivity from './private/createActivity';
import mockAPI from './private/mockAPI';

const SLEEP_INTERVAL = 10;

test('startConversation() reject during iteration should stop everything', async () => {
  const {
    api,
    mock: { continueTurn, startNewConversation }
  } = mockAPI();

  // GIVEN: A chat adapter using ConversationTestApi.
  const adapter = fromTurnBasedChatAdapterAPI(api);

  // ---

  // GIVEN: Implementation of startNewConversation().
  startNewConversation.mockImplementationOnce(() =>
    Promise.resolve({
      action: ExecuteTurnContinuationAction.Continue,
      activities: [createActivity('1')],
      conversationId: 'c-00001'
    })
  );

  continueTurn.mockImplementationOnce(() => Promise.reject(new Error('artificial')));

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

  // THEN: Should call continueTurn().
  expect(continueTurn).toBeCalledTimes(1);
  expect(continueTurn).toHaveBeenNthCalledWith(
    1,
    'c-00001',
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );

  // THEN: Should observe activity completed.
  expect(activityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', expect.objectContaining({ text: '1' })],
    ['complete']
  ]);

  // THEN: Should observe online before complete.
  expect(connectionStatusObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', ConnectionStatus.Uninitialized],
    ['next', ConnectionStatus.Connecting],
    ['next', ConnectionStatus.Online],
    ['next', ConnectionStatus.FailedToConnect],
    ['complete']
  ]);

  // ---

  // WHEN: Call postActivity().
  const postActivityObserver = new MockObserver();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);
  await sleep(SLEEP_INTERVAL);

  // THEN: Should not resolve postActivity().
  expect(postActivityObserver).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', expect.any(Error)]
  ]);

  expect(() => {
    throw postActivityObserver.observations[1][1];
  }).toThrow('artificial');
});
