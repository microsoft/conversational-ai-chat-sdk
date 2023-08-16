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

test('postActivity() before startConversation() should call execute() only after connected', async () => {
  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>(activity => ({
    activities: (async function* () {
      yield [{ ...activity, id: 'a-00001' }, createActivity('1')];
    })(),
    activityID: Promise.resolve('a-00001')
  }));

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => ({
    execute,
    initialActivities: (async function* () {
      yield [createActivity('0')];
    })()
  }));

  // GIVEN: A chat adapter.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const activityObserver = new MockObserver<Activity>();

  // ---

  // WHEN: postActivity() is called before connect.
  const postActivityObserver = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver);

  // THEN: Should not call execute().
  await waitFor(() => expect(execute).toBeCalledTimes(0));

  // THEN: Should not observe anything.
  await waitFor(() => expect(postActivityObserver).toHaveProperty('observations', [['start', expect.any(Object)]]));

  // ---

  // WHEN: Connect.
  adapter.activity$.subscribe(activityObserver);

  // THEN: Should call startConversation().
  await waitFor(() => expect(startConversation).toHaveBeenCalledTimes(1));

  // THEN: Should call execute().
  await waitFor(() => expect(execute).toBeCalledTimes(1));

  // THEN: Should resolve the postActivity() call.
  await waitFor(() =>
    expect(postActivityObserver).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 'a-00001'],
      ['complete']
    ])
  );

  // THEN: Should echo back the activity and the reply.
  await waitFor(() => expect(activityObserver.observations).toHaveLength(4));
  await waitFor(() =>
    expect(activityObserver.observations).toEqual([
      ['start', expect.any(Object)],
      ['next', expect.objectContaining({ text: '0' })],
      ['next', expect.objectContaining({ id: 'a-00001', text: 'Aloha!' })],
      ['next', expect.objectContaining({ text: '1' })]
    ])
  );
});
