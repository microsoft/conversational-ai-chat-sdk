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

test('end() after startConversation() end should stop everything', async () => {
  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>();

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => ({
    execute,
    initialActivities: (async function* () {
      // Intentionally left blank.
    })()
  }));

  // GIVEN: A chat adapter.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const activityObserver = new MockObserver<Activity>();
  const connectionStatusObserver = new MockObserver<ConnectionStatus>();

  adapter.connectionStatus$.subscribe(connectionStatusObserver);

  // WHEN: Connect.
  adapter.activity$.subscribe(activityObserver);

  // THEN: startConversation() should be called.
  waitFor(() => expect(startConversation).toBeCalledTimes(1));
  waitFor(() => expect(startConversation.mock.calls[0][0]).toHaveProperty('signal.aborted', false));

  // THEN: Connection status should turn from "uninitialized" to "connecting" to "online".
  waitFor(() =>
    expect(connectionStatusObserver.observations).toEqual([
      ['start', expect.any(Object)],
      ['next', ConnectionStatus.Uninitialized],
      ['next', ConnectionStatus.Connecting],
      ['next', ConnectionStatus.Online]
    ])
  );

  // ---

  // WHEN: end() is called.
  adapter.end();

  // THEN: Activity observable should be complete.
  waitFor(() => expect(activityObserver.observations).toEqual([['start', expect.any(Object)], ['complete']]));

  // THEN: Connection status should turn to "ended" and completed.
  waitFor(() =>
    expect(connectionStatusObserver.observations).toEqual([
      ['start', expect.any(Object)],
      ['next', ConnectionStatus.Uninitialized],
      ['next', ConnectionStatus.Connecting],
      ['next', ConnectionStatus.Online],
      ['next', ConnectionStatus.Ended],
      ['complete']
    ])
  );

  // ---

  // WHEN: postActivity() is being called.
  const postActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);

  // THEN: It should reject.
  waitFor(() =>
    expect(postActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['error', expect.any(Error)]
    ])
  );

  waitFor(() =>
    expect(() => {
      throw postActivityObserver.observations[1][1];
    }).toThrow('closed')
  );
});
