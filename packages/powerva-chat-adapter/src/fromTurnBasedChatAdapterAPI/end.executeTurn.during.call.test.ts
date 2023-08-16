/** @jest-environment jsdom */

/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';
// TODO: When Jest support named export, we should shorten the path.
import { MockObserver } from 'powerva-chat-adapter-test-util';
import { DeferredPromise, ExecuteTurnContinuationAction } from 'powerva-turn-based-chat-adapter-framework';
import { waitFor } from '@testing-library/dom';

import fromTurnBasedChatAdapterAPI from '../../src/fromTurnBasedChatAdapterAPI';

import createActivity from './private/createActivity';
import mockAPI from './private/mockAPI';

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

  // THEN: Should call executeTurn();
  await waitFor(() => expect(executeTurn).toBeCalledTimes(1));
  await waitFor(() =>
    expect(executeTurn).toHaveBeenNthCalledWith(
      1,
      'c-00001',
      expect.objectContaining({ text: 'Aloha!' }),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  );

  // THEN: Should observe nothing.
  await waitFor(() => expect(postActivityObserver).toHaveProperty('observations', [['start', expect.any(Object)]]));

  // ---

  // WHEN: Call end().
  adapter.end();

  // THEN: Should signal abort.
  await waitFor(() => expect(executeTurn.mock.calls[0][2]).toHaveProperty('signal.aborted', true));

  // THEN: Should observe error.
  await waitFor(() =>
    expect(postActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['error', expect.any(Error)]
    ])
  );

  await waitFor(() =>
    expect(() => {
      throw postActivityObserver.observations[1][1];
    }).toThrow('closed')
  );

  // THEN: Should observe activity complete.
  await waitFor(() =>
    expect(activityObserver).toHaveProperty('observations', [['start', expect.any(Object)], ['complete']])
  );

  // THEN: Should observe connection status ended.
  await waitFor(() =>
    expect(connectionStatusObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', ConnectionStatus.Uninitialized],
      ['next', ConnectionStatus.Connecting],
      ['next', ConnectionStatus.Online],
      ['next', ConnectionStatus.Ended],
      ['complete']
    ])
  );

  // ---

  // WHEN: Call postActivity().
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
    }).toThrow('closed')
  );
});
