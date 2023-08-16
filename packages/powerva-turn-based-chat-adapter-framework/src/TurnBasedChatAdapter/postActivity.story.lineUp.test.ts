/** @jest-environment jsdom */

/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';
import { MockObserver } from 'powerva-chat-adapter-test-util';
import { waitFor } from '@testing-library/dom';

import DeferredPromise from '../DeferredPromise';
import TestCanvasChatAdapter from '../TurnBasedChatAdapter';

import createActivity from './private/createActivity';

import type { TurnBasedChatIteratorClient } from '../types/TurnBasedChatIteratorClient';

type Execute = TurnBasedChatIteratorClient['execute'];
type StartConversation = ConstructorParameters<typeof TestCanvasChatAdapter>[0];

test('call postActivity() in quick successsion should line up all calls', async () => {
  const pauses = [new DeferredPromise<void>(), new DeferredPromise<void>(), new DeferredPromise<void>()];
  const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>();

  execute.mockImplementationOnce(activity => {
    return {
      activities: (async function* (): AsyncIterableIterator<Activity[]> {
        await pauses[0].promise;
        yield [{ ...activity, id: 'a-00001' }, createActivity('1')];
        await pauses[1].promise;
      })(),
      activityID: Promise.resolve('a-00001')
    };
  });

  execute.mockImplementationOnce(activity => {
    return {
      activities: (async function* (): AsyncIterableIterator<Activity[]> {
        await pauses[2].promise;
        yield [{ ...activity, id: 'a-00002' }, createActivity('2')];
      })(),
      activityID: Promise.resolve('a-00002')
    };
  });

  const startConversation = jest.fn<ReturnType<StartConversation>, Parameters<StartConversation>>(async () => ({
    execute,
    initialActivities: (async function* () {
      yield [createActivity('0')];
    })()
  }));

  // GIVEN: A chat adapter with subscription to activity$ observable.
  const adapter = new TestCanvasChatAdapter(startConversation);
  const activityObserver = new MockObserver<Activity>();

  adapter.activity$.subscribe(activityObserver);

  // ---

  // WHEN: postActivity() is being called twice in quick succession.
  const postActivityObserver1 = new MockObserver<string>();
  const postActivityObserver2 = new MockObserver<string>();

  adapter.postActivity(createActivity('Aloha!')).subscribe(postActivityObserver1);
  adapter.postActivity(createActivity('Hello!')).subscribe(postActivityObserver2);

  // THEN: It should have called the execute() once.
  await waitFor(() => expect(execute).toBeCalledTimes(1));

  // ---

  // WHEN: The first round is completed.
  pauses[0].resolve();

  // THEN: The first postActivity() should be resolved.
  await waitFor(() =>
    expect(postActivityObserver1).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 'a-00001'],
      ['complete']
    ])
  );

  // THEN: It should observe the echo back activity and activities from first round.
  await waitFor(() =>
    expect(activityObserver.observations).toEqual([
      ['start', expect.any(Object)],
      ['next', expect.objectContaining({ text: '0' })],
      ['next', expect.objectContaining({ id: 'a-00001', text: 'Aloha!' })],
      ['next', expect.objectContaining({ text: '1' })]
    ])
  );

  // THEN: It should not called "execute" yet.
  await waitFor(() => expect(execute).toBeCalledTimes(1));

  // ---

  // WHEN: The second round is completed.
  pauses[1].resolve();

  // THEN: It should have called the execute() again.
  await waitFor(() => expect(execute).toBeCalledTimes(2));

  // ---

  // WHEN: The second round is completed.
  pauses[2].resolve();

  // THEN: The second postActivity() should be resolved.
  await waitFor(() =>
    expect(postActivityObserver2).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 'a-00002'],
      ['complete']
    ])
  );

  // THEN: It should observe the echo back activity and activities from second round.
  await waitFor(() =>
    expect(activityObserver.observations).toEqual([
      ['start', expect.any(Object)],
      ['next', expect.objectContaining({ text: '0' })],
      ['next', expect.objectContaining({ id: 'a-00001', text: 'Aloha!' })],
      ['next', expect.objectContaining({ text: '1' })],
      ['next', expect.objectContaining({ id: 'a-00002', text: 'Hello!' })],
      ['next', expect.objectContaining({ text: '2' })]
    ])
  );
});
