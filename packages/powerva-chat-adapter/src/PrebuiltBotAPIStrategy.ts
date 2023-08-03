/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { TurnBasedChatAdapterAPIStrategy } from './types/TurnBasedChatAdapterAPIStrategy';

type RequestBodyEnhancer = TurnBasedChatAdapterAPIStrategy['onRequestBody'];

const passthruRequestBodyEnhancer: RequestBodyEnhancer = (_, body) => body;

export default class PrebuiltBotAPIStrategy implements TurnBasedChatAdapterAPIStrategy {
  constructor(
    environmentEndpointURL: URL,
    tenantID: string,
    environmentID: string,
    botIdentifier: string,
    getTokenCallback: () => Promise<string>,
    onRequestBody?: RequestBodyEnhancer
  ) {
    this.#botIdentifier = botIdentifier;
    this.#environmentEndpointURL = environmentEndpointURL;
    this.#environmentID = environmentID;
    this.#getTokenCallback = getTokenCallback;
    // TODO: Do we still need onRequestBody?
    this.#onRequestBody = onRequestBody || passthruRequestBodyEnhancer;
    this.#tenantID = tenantID;
  }

  #botIdentifier: string;
  #environmentEndpointURL: URL;
  #environmentID: string;
  #getTokenCallback: () => Promise<string>;
  #onRequestBody: RequestBodyEnhancer;
  #tenantID: string;

  public async getHeaders() {
    return { Authorization: `Bearer ${await this.#getTokenCallback()}` };
  }

  // TODO: Should we change `pathSuffix` into { conversationID?: string; requestType: 'continueTurn' | 'executeTurn' | 'startNewConversation'; }?
  public async getUrl(pathSuffix: string): Promise<URL> {
    if (/^[./]/u.test(pathSuffix)) {
      throw new Error('"pathSuffix" cannot starts with a dot or slash.');
    }

    const baseUrl = new URL(this.#environmentEndpointURL);

    // /powervirtualagents/tenants/{tenantId}/environments/{environmentId}/prebuilt/authenticated/bots/{botIdentifier}/conversations
    baseUrl.pathname = `/powervirtualagents/tenants/${this.#tenantID}/environments/${
      this.#environmentID
    }/prebuilt/authenticated/bots/${this.#botIdentifier}/${pathSuffix}`;

    return baseUrl;
  }

  public onRequestBody(requestType: 'continueTurn' | 'executeTurn' | 'startNewConversation', body: Readonly<unknown>) {
    return this.#onRequestBody(requestType, body);
  }
}
