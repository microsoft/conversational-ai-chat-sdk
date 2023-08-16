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

test('postActivity() should work', async () => {
  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>(activity => ({
    activities: (async function* () {
      yield [{ ...activity, id: 'a-00001' }, createActivity('1')];
      yield [createActivity('2')];
    })(),
    activityID: Promise.resolve('a-00001')
  }));

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(() =>
    Promise.resolve({
      execute,
      initialActivities: (async function* () {
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

  // THEN: Should echo back activity.
  await waitFor(() =>
    expect(activityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      [
        'next',
        expect.objectContaining({
          id: 'a-00001',
          text: 'Aloha!'
        })
      ],
      ['next', expect.objectContaining({ text: '1' })],
      ['next', expect.objectContaining({ text: '2' })]
    ])
  );
});
