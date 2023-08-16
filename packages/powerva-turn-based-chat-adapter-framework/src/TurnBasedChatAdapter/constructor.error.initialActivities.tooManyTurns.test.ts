/** @jest-environment jsdom */

/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';
import { MockObserver } from 'powerva-chat-adapter-test-util';
import { waitFor } from '@testing-library/dom';

import DeferredPromise from '../DeferredPromise';
import TestCanvasChatAdapter from '../TurnBasedChatAdapter';

import createActivity from './private/createActivity';

import type { TurnBasedChatIteratorClient } from '../types/TurnBasedChatIteratorClient';

type Execute = TurnBasedChatIteratorClient['execute'];
type StartConversation = ConstructorParameters<typeof TestCanvasChatAdapter>[0];

test('startConversation() with more than 100 turns should error', async () => {
  const pause = new DeferredPromise<void>();
  const iterate = jest.fn();

  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>();

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => ({
    execute,
    initialActivities: (async function* () {
      for (let index = 0; index < 100; index++) {
        iterate();

        yield [];
      }

      await pause.promise;

      yield [createActivity('1')];
    })()
  }));

  // GIVEN: A chat adapter.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);

  // ---

  // WHEN: Connect.
  const activityObserver = new MockObserver<Activity>();

  adapter.activity$.subscribe(activityObserver);

  // THEN: Should call startConversation().
  await waitFor(() => expect(startConversation).toBeCalledTimes(1));

  // THEN: Should iterated 100 times.
  await waitFor(() => expect(iterate).toBeCalledTimes(100));

  // ---

  // WHEN: Iterate for 101st time.
  pause.resolve();

  // THEN: The adapter should end.
  await waitFor(() =>
    expect(connectionStatusObserver.observations).toEqual([
      ['start', expect.any(Object)],
      ['next', ConnectionStatus.Uninitialized],
      ['next', ConnectionStatus.Connecting],
      ['next', ConnectionStatus.Online],
      ['next', ConnectionStatus.FailedToConnect],
      ['complete']
    ])
  );

  // THEN: Activity should observe complete.
  await waitFor(() => expect(activityObserver.observations).toEqual([['start', expect.any(Object)], ['complete']]));

  // ---

  // WHEN: Call postActivity().
  const postActivityObserver = new MockObserver();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);

  // THEN: Should reject with error "too many turns".
  await waitFor(() =>
    expect(postActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['error', expect.any(Error)]
    ])
  );

  expect(() => {
    throw postActivityObserver.observations[1][1];
  }).toThrow('Too many turns');
});
