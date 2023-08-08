/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';

type PartialRequestInit = {
  body?: Record<string, unknown>;
  headers?: HeadersInit;
  url: URL;
};

export interface TurnBasedChatAdapterAPIStrategy {
  prepareContinueTurn(conversationId: string): Promise<PartialRequestInit>;
  prepareExecuteTurn(
    conversationId: string,
    init: Readonly<{ activity: Readonly<Activity> }>
  ): Promise<PartialRequestInit>;
  prepareStartNewConversation(init: Readonly<{ emitStartConversationEvent: boolean }>): Promise<PartialRequestInit>;
}
