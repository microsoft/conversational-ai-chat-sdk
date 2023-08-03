/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

type RequestBody = unknown;

export interface TurnBasedChatAdapterAPIStrategy {
  getHeaders(): Promise<HeadersInit>;
  getUrl(pathSuffix: string): Promise<URL>;

  onRequestBody(
    requestType: 'continueTurn' | 'executeTurn' | 'startNewConversation',
    body: Readonly<RequestBody>
  ): Readonly<RequestBody>;
}
