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

test('postActivity() should stop after 100 turns', async () => {
  const pause = new DeferredPromise<void>();
  const iterate = jest.fn();

  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>(activity => ({
    activities: (async function* () {
      for (let index = 0; index < 100; index++) {
        iterate();

        yield index ? [] : [{ ...activity, id: 'a-00001' }];
      }

      await pause.promise;

      yield [createActivity('1')];
    })(),
    activityID: Promise.resolve('a-00001')
  }));

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
  adapter.activity$.subscribe(activityObserver);

  // ---

  // WHEN: postActivity() is called.
  const postActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);

  // THEN: Should call execute() and iterate 100 times.
  await waitFor(() => expect(iterate).toBeCalledTimes(100));

  // THEN: Should resolve the postActivity() call.
  await waitFor(() =>
    expect(postActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 'a-00001'],
      ['complete']
    ])
  );

  // THEN: Should observe echo back.
  await waitFor(() =>
    expect(activityObserver.observations).toEqual([
      ['start', expect.any(Object)],
      [
        'next',
        expect.objectContaining({
          id: 'a-00001',
          text: 'Aloha!'
        })
      ]
    ])
  );

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
  await waitFor(() =>
    expect(activityObserver.observations).toEqual([
      ['start', expect.any(Object)],
      [
        'next',
        expect.objectContaining({
          id: 'a-00001',
          text: 'Aloha!'
        })
      ],
      ['complete']
    ])
  );

  // ---

  // WHEN: Call postActivity() again.
  const anotherPostActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Hello!')).subscribe(anotherPostActivityObserver);

  // THEN: Should reject with error "too many turns".
  await waitFor(() =>
    expect(anotherPostActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['error', expect.any(Error)]
    ])
  );

  await waitFor(() =>
    expect(() => {
      throw anotherPostActivityObserver.observations[1][1];
    }).toThrow('Too many turns')
  );
});
