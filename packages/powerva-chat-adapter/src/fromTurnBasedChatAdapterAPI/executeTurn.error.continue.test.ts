/** @jest-environment jsdom */

/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';
// TODO: When Jest support named export, we should shorten the path.
import { MockObserver } from 'powerva-chat-adapter-test-util';
import { ExecuteTurnContinuationAction } from 'powerva-turn-based-chat-adapter-framework';
import { waitFor } from '@testing-library/dom';

import fromTurnBasedChatAdapterAPI from '../../src/fromTurnBasedChatAdapterAPI';

import createActivity from './private/createActivity';
import mockAPI from './private/mockAPI';

test('executeTurn() reject during continueTurn() should stop everything', async () => {
  const {
    api,
    mock: { continueTurn, executeTurn, startNewConversation }
  } = mockAPI();

  // GIVEN: A chat adapter using ConversationTestApi.
  const adapter = fromTurnBasedChatAdapterAPI(api);

  // ---

  // GIVEN: Implementation of startNewConversation().
  startNewConversation.mockImplementationOnce(() =>
    Promise.resolve({
      action: ExecuteTurnContinuationAction.Waiting,
      activities: [createActivity('1')],
      conversationId: 'c-00001'
    })
  );

  executeTurn.mockImplementationOnce(() =>
    Promise.resolve({
      action: ExecuteTurnContinuationAction.Continue,
      activities: [createActivity('2')]
    })
  );

  continueTurn.mockImplementationOnce(() => Promise.reject(new Error('artificial')));

  // WHEN: Connect.
  const activityObserver = new MockObserver<Activity>();
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);
  adapter.activity$.subscribe(activityObserver);

  // THEN: Should call startNewConversation().
  await waitFor(() => expect(startNewConversation).toBeCalledTimes(1));
  await waitFor(() =>
    expect(startNewConversation).toHaveBeenNthCalledWith(
      1,
      true,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  );

  // ---

  // WHEN: Call postActivity().
  const postActivityObserver = new MockObserver();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);

  // THEN: Should resolve postActivity().
  await waitFor(() =>
    expect(postActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', expect.any(String)],
      ['complete']
    ])
  );

  // THEN: Should observe activity completed.
  await waitFor(() =>
    expect(activityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', expect.objectContaining({ text: '1' })],
      ['next', expect.objectContaining({ text: 'Aloha!' })],
      ['next', expect.objectContaining({ text: '2' })],
      ['complete']
    ])
  );

  // THEN: Should observe connection status completed.
  await waitFor(() =>
    expect(connectionStatusObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', ConnectionStatus.Uninitialized],
      ['next', ConnectionStatus.Connecting],
      ['next', ConnectionStatus.Online],
      ['next', ConnectionStatus.FailedToConnect],
      ['complete']
    ])
  );

  // ---

  // WHEN: Call postActivity() again.
  const anotherPostActivityObserver = new MockObserver();

  adapter.postActivity(createActivity('Aloha!')).subscribe(anotherPostActivityObserver);

  // THEN: Should not resolve postActivity().
  await waitFor(() =>
    expect(anotherPostActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['error', expect.any(Error)]
    ])
  );

  await waitFor(() =>
    expect(() => {
      throw anotherPostActivityObserver.observations[1][1];
    }).toThrow('artificial')
  );
});
