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

test('end() before execute() should stop everything', async () => {
  const pause = new DeferredPromise<never>();

  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>(() => ({
    // For testing purpose.
    // eslint-disable-next-line require-yield
    activities: (async function* () {
      await pause.promise;
    })(),
    activityID: pause.promise
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
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);
  adapter.activity$.subscribe(activityObserver);

  // WHEN: Call postActivity().
  const postActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);

  // THEN: It should call execute().
  await waitFor(() => expect(execute).toBeCalledTimes(1));

  // ---

  // WHEN: End.
  adapter.end();

  // THEN: Connection status should observe "ended".
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

  // THEN: Activity should observe complete.
  await waitFor(() =>
    expect(activityObserver).toHaveProperty('observations', [['start', expect.any(Object)], ['complete']])
  );

  // THEN: Call to postActivity() should be rejected with error of "closed".
  await waitFor(() =>
    expect(postActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['error', expect.any(Error)]
    ])
  );

  expect(() => {
    throw postActivityObserver.observations[1][1];
  }).toThrow('closed');
});
