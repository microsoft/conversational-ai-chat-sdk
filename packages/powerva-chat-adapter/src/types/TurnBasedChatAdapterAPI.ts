/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { ConversationId } from './private/ConversationId';
import type { ExecuteTurnResponse } from './private/ExecuteTurnResponse';
import type { StartResponse } from './private/StartResponse';
import type { Activity } from 'botframework-directlinejs';

type Options = {
  signal?: AbortSignal;
};

export interface TurnBasedChatAdapterAPI {
  startNewConversation(emitStartConversationEvent: boolean, options?: Options): Promise<StartResponse>;

  executeTurn(conversationId: ConversationId, activity: Activity, options?: Options): Promise<ExecuteTurnResponse>;

  continueTurn(conversationId: ConversationId, options?: Options): Promise<ExecuteTurnResponse>;
}
