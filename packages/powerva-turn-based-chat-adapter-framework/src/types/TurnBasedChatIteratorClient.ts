/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { Activity } from 'botframework-directlinejs';

export type TurnBasedChatIteratorClient = {
  /**
   * Sends an activity and receives the iterator for the next set of activities.
   */
  execute: (activity: Activity) => {
    // TODO: [hawo] The next version should yield return the next execute() function.
    //              Thus, once the execute() function is called, it cannot be called again until the next execute() from the yield return.
    //              If the yield-returned null/undefined, it means the connection is gracefully closed.
    activities: AsyncIterableIterator<Activity[]>;
    activityID: Promise<string> | string;
  };

  /**
   * Gets the iterator for the initial set of activities.
   */
  initialActivities: AsyncIterableIterator<Activity[]>;
};
