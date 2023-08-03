/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { ExecuteTurnContinuationAction } from 'powerva-turn-based-chat-adapter-framework';
import type { Activity } from 'botframework-directlinejs';

/**
 * Base interface for responses from the bot.
 */
export interface ResponseBase {
  /**
   * A list of activities which represent the response from the bot.
   */
  activities: Activity[];

  /**
   * The action the bot should take after receiving this response.
   */
  action: ExecuteTurnContinuationAction;
}
