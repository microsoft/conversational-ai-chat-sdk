/** @jest-environment jsdom */

/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';
import { MockObserver } from 'powerva-chat-adapter-test-util';
import { waitFor } from '@testing-library/dom';

import TestCanvasChatAdapter from '../TurnBasedChatAdapter';

import createActivity from './private/createActivity';

import type { TurnBasedChatIteratorClient } from '../types/TurnBasedChatIteratorClient';

type Execute = TurnBasedChatIteratorClient['execute'];
type StartConversation = ConstructorParameters<typeof TestCanvasChatAdapter>[0];

test('postActivity() without any echo back should work', async () => {
  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>();

  execute.mockImplementationOnce(() => ({
    activities: (async function* (): AsyncIterableIterator<Activity[]> {
      // Intentionally left blank.
    })(),
    activityID: Promise.resolve('a-00001')
  }));

  execute.mockImplementationOnce(() => ({
    activities: (async function* (): AsyncIterableIterator<Activity[]> {
      // Intentionally left blank.
    })(),
    activityID: Promise.resolve('a-00002')
  }));

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(() =>
    Promise.resolve({
      execute,
      initialActivities: (async function* (): AsyncIterableIterator<Activity[]> {
        // Intentionally left blank.
      })()
    })
  );

  // GIVEN: A connected chat adapter.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const activityObserver = new MockObserver<Activity>();
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);
  adapter.activity$.subscribe(activityObserver);

  // ---

  // WHEN: Call postActivity().
  const postActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);

  // THEN: Should be resolved.
  await waitFor(() =>
    expect(postActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 'a-00001'],
      ['complete']
    ])
  );

  // THEN: Should not observe any echo back.
  await waitFor(() => expect(activityObserver).toHaveProperty('observations', [['start', expect.any(Object)]]));

  // ---

  // WHEN: Call postActivity() again.
  const anotherPostActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Hello!')).subscribe(anotherPostActivityObserver);

  // THEN: Should be resolved.
  await waitFor(() =>
    expect(anotherPostActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 'a-00002'],
      ['complete']
    ])
  );

  // THEN: Should not observe any echo back.
  await waitFor(() => expect(activityObserver).toHaveProperty('observations', [['start', expect.any(Object)]]));
});
