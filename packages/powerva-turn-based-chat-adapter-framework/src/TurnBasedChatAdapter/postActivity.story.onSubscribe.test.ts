/** @jest-environment jsdom */

/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';
import { MockObserver } from 'powerva-chat-adapter-test-util';
import { waitFor } from '@testing-library/dom';

import TestCanvasChatAdapter from '../TurnBasedChatAdapter';

import createActivity from './private/createActivity';

import type { TurnBasedChatIteratorClient } from '../types/TurnBasedChatIteratorClient';

type Execute = TurnBasedChatIteratorClient['execute'];
type StartConversation = ConstructorParameters<typeof TestCanvasChatAdapter>[0];

test('postActivity() should only call execute() when subscribed', async () => {
  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>(activity => ({
    activities: (async function* () {
      yield [{ ...activity, id: 'a-00001' }];
    })(),
    activityID: Promise.resolve('a-00001')
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

  adapter.activity$.subscribe(activityObserver);

  // ---

  // WHEN: postActivity() is called without subscription
  const postActivityObservable = adapter.postActivity(createActivity('Aloha!'));

  // THEN: It should not call execute().
  await waitFor(() => expect(execute).toBeCalledTimes(0));

  // THEN: It should call startConversation.
  await waitFor(() => expect(startConversation).toHaveBeenCalledTimes(1));

  // ---

  // WHEN: Subscribe to the observable returned from postActivity() call multiple times.
  const postActivityObserver = new MockObserver<string>();
  const anotherPostActivityObserver = new MockObserver<string>();
  postActivityObservable.subscribe(postActivityObserver);
  postActivityObservable.subscribe(anotherPostActivityObserver);

  // THEN: It should call execute() once.
  await waitFor(() => expect(execute).toBeCalledTimes(1));

  // THEN: It should resolve the observation for both postActivity() call.
  await waitFor(() =>
    expect(postActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 'a-00001'],
      ['complete']
    ])
  );

  await waitFor(() =>
    expect(anotherPostActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 'a-00001'],
      ['complete']
    ])
  );

  // THEN: It should echo back the activity.
  await waitFor(() =>
    expect(activityObserver.observations).toEqual([
      ['start', expect.any(Object)],
      ['next', expect.objectContaining({ id: 'a-00001', text: 'Aloha!' })]
    ])
  );
});
