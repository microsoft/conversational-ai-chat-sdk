/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';
import noop from 'lodash/noop';

import AbortPromise from './private/AbortPromise';
import DeferredObservable from './private/DeferredObservable';
import DeferredPromise from './DeferredPromise';
import Observable from './Observable';
import QueueWithConsumer from './private/QueueWithConsumer';
import shareObservable from './private/shareObservable';

import type { ChatAdapter } from './types/ChatAdapter';
import type { TurnBasedChatIteratorClient } from './types/TurnBasedChatIteratorClient';

// "error" is actually "any".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostActivityEntry = readonly [Readonly<Activity>, (activityID: string) => void, (error?: any) => void];

type Consumer = ConstructorParameters<typeof QueueWithConsumer<Readonly<PostActivityEntry>>>[0];

/**
 * When called, it should connect to the service and receive first set of activities.
 *
 * It will return an iterator client.
 */
type StartConversationCallback = (options: {
  /**
   * Signal to close the connection. It should abort the start conversation and all subsequent actions.
   */
  signal: AbortSignal;
}) => Promise<TurnBasedChatIteratorClient>;

const CLOSED_ERROR_MESSAGE = 'closed';
const MAX_TURN_COUNT = 100;

/**
 * Turn-based chat adapter framework for Bot Framework Web Chat.
 */
export class TurnBasedChatAdapter implements ChatAdapter {
  /**
   * Creates a turn-based chat adapter from an iterator client factory.
   */
  constructor(startConversationCallback: StartConversationCallback) {
    this.#connectionDeferred = new DeferredPromise();

    // #connectionDeferred is for blocking #consumePostActivity before connection is established.
    // It will resolve when connection established, or rejected when connection failed or aborted during connecting.
    // We need to catch the unhandled rejection if #consumePostActivity is not called yet.
    this.#connectionDeferred.promise.catch(noop);

    this.#deferredActivities = new DeferredObservable(() => {
      // Intentionally calling the async function without the result.
      // We used async IIFE. However, Webpack marked it as pure and Terser treeshaken it off.
      this.#kickoffConnect().then(noop);
    });
    this.#deferredConnectionStatuses = new DeferredObservable<ConnectionStatus>(observer =>
      observer.next(ConnectionStatus.Uninitialized)
    );

    this.#postQueue = new QueueWithConsumer<PostActivityEntry>(this.#consumePostActivity);
    this.#startConversationCallback = startConversationCallback;
    this.#sharedActivities = shareObservable(this.#deferredActivities.observable);
    this.#sharedConnectionStatuses = shareObservable(this.#deferredConnectionStatuses.observable);

    // This is "close/abort connection" logics.
    // We prefer writing the logic in Promise.catch() statement because it will only run once ever.
    // "reason" is actually "error", which is any.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.#abortPromise.promise.catch((reason?: any) => {
      // For all promises and observables, there could be active subscriptions.
      // First, we need to resolve/reject/complete all active subscriptions.
      // Then, we shutdown future subscriptions by overwriting the promises and observables.

      this.#connectionDeferred.reject(reason || new Error(CLOSED_ERROR_MESSAGE));
      this.#connectionDeferred = DeferredPromise.reject<TurnBasedChatIteratorClient>(
        reason || new Error(CLOSED_ERROR_MESSAGE)
      );
      // No need to throw unhandled rejection.
      // We probably won't catch this one sooner than the next call to postActivity().
      this.#connectionDeferred.promise.catch(noop);

      this.#deferredActivities.complete();
      this.#deferredActivities = DeferredObservable.from<Activity>([]);

      this.#deferredConnectionStatuses.next(reason ? ConnectionStatus.FailedToConnect : ConnectionStatus.Ended);
      this.#deferredConnectionStatuses.complete();
      this.#deferredConnectionStatuses = DeferredObservable.from<ConnectionStatus>([
        ConnectionStatus.Uninitialized,
        ConnectionStatus.Ended
      ]);

      this.#sharedActivities = shareObservable(this.#deferredActivities.observable);
      this.#sharedConnectionStatuses = shareObservable(this.#deferredConnectionStatuses.observable);
    });
  }

  readonly #abortPromise: AbortPromise = new AbortPromise();
  readonly #postQueue: QueueWithConsumer<PostActivityEntry>;
  readonly #startConversationCallback: StartConversationCallback;

  #connectionDeferred: DeferredPromise<TurnBasedChatIteratorClient>;
  #deferredActivities: DeferredObservable<Activity>;
  #deferredConnectionStatuses: DeferredObservable<ConnectionStatus>;
  #kickedOff = false;
  #sharedActivities: Observable<Activity>;
  #sharedConnectionStatuses: Observable<ConnectionStatus>;

  #consumePostActivity: Consumer = async ([activity, resolvePostActivity, rejectPostActivity]) => {
    try {
      // If connection is closed, #connectionDeferred.promise will reject.
      const { execute } = await this.#connectionDeferred.promise;

      const { activities, activityID } = execute(activity);

      // When both "activityID" and "activities" are resolved, we will release this consumer.
      await Promise.race([
        this.#abortPromise.promise,
        Promise.all([
          // Returns activity ID for the postActivity() call.
          Promise.resolve(activityID).then(resolvePostActivity, error => {
            rejectPostActivity(error);

            // Propagates the error to the try-catch block.
            return Promise.reject(error);
          }),
          // Iterate activities.
          this.#iterateActivities(activities)
        ])
      ]);
    } catch (error) {
      // If iterate activities failed, also reject the postActivity() if it has not been resolved.
      // When end() is called, "error" is undefined.
      rejectPostActivity(error || new Error(CLOSED_ERROR_MESSAGE));

      // When hitting any errors while executing turns, we should fail the connection.
      this.#end(error);

      // Propagates error back to QueueWithConsumer for its "errorCallback".
      throw error;
    }
  };

  // "reason" is actually "error", which is "any".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #end(reason?: any) {
    this.#abortPromise?.abort(reason);
  }

  async #iterateActivities(activities: AsyncIterableIterator<Activity[]>) {
    const { signal } = this.#abortPromise;
    let numTurnLeft = MAX_TURN_COUNT;

    for await (const batch of activities) {
      // Iterator should honor abort signal by rejecting.
      // However, if iterator does not honor abort signal, break it here.
      if (signal.aborted) {
        return await this.#abortPromise.promise;
      }

      // Fail-safe: should not go more than 100 turns, probably engine issues.
      if (numTurnLeft-- <= 0) {
        throw new Error('Too many turns');
      }

      batch.map(this.#deferredActivities.next.bind(this.#deferredActivities));
    }
  }

  /**
   * Kicks off connection asynchronously without waiting for neither success or failure.
   *
   * To check connection status, wait for `#connectionDeferred.promise`.
   *
   * Note: this function will never reject.
   */
  async #kickoffConnect(): Promise<void> {
    // Only kick off once in the lifetime.
    if (this.#kickedOff) {
      return;
    }

    this.#kickedOff = true;

    const { signal } = this.#abortPromise;

    this.#deferredConnectionStatuses.next(ConnectionStatus.Connecting);

    let connection: TurnBasedChatIteratorClient;

    try {
      connection = await this.#startConversationCallback({ signal });

      if (signal.aborted) {
        return;
      }

      // Web Chat requires connection status to be "online" before it will subscribe to activity$.
      // We need to yield the control back to Web Chat so it can start its subscription.
      this.#deferredConnectionStatuses.next(ConnectionStatus.Online);
      await new Promise(resolve => setTimeout(resolve, 0));

      await this.#iterateActivities(connection.initialActivities);
    } catch (error) {
      return this.#end(error);
    }

    // When #connectionDeferred is resolved, it will unblock postActivity().
    this.#connectionDeferred.resolve(connection);
  }

  get activity$() {
    return this.#sharedActivities;
  }

  get connectionStatus$() {
    return this.#sharedConnectionStatuses;
  }

  public end() {
    this.#end();
  }

  public postActivity(activity: Readonly<Activity>): Observable<string> {
    // When the observable is subscribed, start sending the activity.
    return shareObservable(
      new Observable<string>(observer => {
        // We are using deferred for conveniences. After calling either resolve/reject, future calls to resolve/reject will be ignored.
        const deferred = new DeferredPromise<string>();

        deferred.promise.then(activityID => {
          observer.next(activityID);
          observer.complete();
        }, observer.error.bind(observer));

        this.#postQueue.push(
          Object.freeze([
            activity,
            deferred.resolve.bind(deferred),
            deferred.reject.bind(deferred)
          ]) as PostActivityEntry
        );
      }) as Observable<string>
    );
  }
}

export default TurnBasedChatAdapter;
