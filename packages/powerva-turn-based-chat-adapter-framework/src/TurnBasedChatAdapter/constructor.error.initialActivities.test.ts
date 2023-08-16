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

test('startConversation().iterate reject should stop everything', async () => {
  const pause = new DeferredPromise<void>();
  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>();

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(() =>
    Promise.resolve({
      execute,
      // For testing purpose.
      // eslint-disable-next-line require-yield
      initialActivities: (async function* () {
        await pause.promise;

        throw new Error('artificial');
      })()
    })
  );

  // GIVEN: A connected chat adapter.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const activityObserver = new MockObserver<Activity>();
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);
  adapter.activity$.subscribe(activityObserver);

  // THEN: Should call startConversation().
  await waitFor(() => expect(startConversation).toBeCalledTimes(1));

  // THEN: Connection status should observe "uninitialized", "connecting", and "online".
  await waitFor(() =>
    expect(connectionStatusObserver.observations).toEqual([
      ['start', expect.any(Object)],
      ['next', ConnectionStatus.Uninitialized],
      ['next', ConnectionStatus.Connecting],
      ['next', ConnectionStatus.Online]
    ])
  );

  // THEN: Activity should observe start.
  await waitFor(() => expect(activityObserver.observations).toEqual([['start', expect.any(Object)]]));

  // ---

  // WHEN: Resume.
  pause.resolve();

  // THEN: Connection status should observe "failed to connect" and complete.
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
  const postActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);

  // THEN: Should reject with error "artificial".
  await waitFor(() =>
    expect(postActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['error', expect.any(Error)]
    ])
  );

  await waitFor(() =>
    expect(() => {
      throw postActivityObserver.observations[1][1];
    }).toThrow('artificial')
  );
});
