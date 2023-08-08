/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { TurnBasedChatAdapterAPIStrategy } from './types/TurnBasedChatAdapterAPIStrategy';

type PrebuiltBotAPIStrategyInit = {
  botIdentifier: string;
  environmentEndpointURL: URL;
  getTokenCallback: () => Promise<string>;
};

const API_VERSION = '2022-03-01-preview';

export default class PrebuiltBotAPIStrategy implements TurnBasedChatAdapterAPIStrategy {
  constructor({ botIdentifier, environmentEndpointURL, getTokenCallback }: PrebuiltBotAPIStrategyInit) {
    this.#botIdentifier = botIdentifier;
    this.#environmentEndpointURL = environmentEndpointURL;
    this.#getTokenCallback = getTokenCallback;
  }

  #botIdentifier: string;
  #environmentEndpointURL: URL;
  #getTokenCallback: () => Promise<string>;

  async #getHeaders() {
    return { authorization: `Bearer ${await this.#getTokenCallback()}` };
  }

  public async prepareContinueTurn(
    conversationId: string
  ): ReturnType<TurnBasedChatAdapterAPIStrategy['prepareContinueTurn']> {
    const url = new URL(
      `/powervirtualagents/prebuilt/authenticated/bots/${this.#botIdentifier}/conversations/${conversationId}/continue`,
      this.#environmentEndpointURL
    );

    url.searchParams.set('api-version', API_VERSION);

    return { headers: { 'x-ms-conversationid': conversationId, ...(await this.#getHeaders()) }, url };
  }

  public async prepareExecuteTurn(
    conversationId: string
  ): ReturnType<TurnBasedChatAdapterAPIStrategy['prepareExecuteTurn']> {
    const url = new URL(
      `/powervirtualagents/prebuilt/authenticated/bots/${this.#botIdentifier}/conversations/${conversationId}`,
      this.#environmentEndpointURL
    );

    url.searchParams.set('api-version', API_VERSION);

    return { headers: { 'x-ms-conversationid': conversationId, ...(await this.#getHeaders()) }, url };
  }

  public async prepareStartNewConversation(): ReturnType<TurnBasedChatAdapterAPIStrategy['prepareExecuteTurn']> {
    const url = new URL(
      `/powervirtualagents/prebuilt/authenticated/bots/${this.#botIdentifier}`,
      this.#environmentEndpointURL
    );

    url.searchParams.set('api-version', API_VERSION);

    return { url };
  }
}
