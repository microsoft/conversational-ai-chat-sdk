/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { TurnBasedChatAdapterAPIStrategy } from './types/TurnBasedChatAdapterAPIStrategy';

type RequestBodyEnhancer = TurnBasedChatAdapterAPIStrategy['onRequestBody'];

const passthruRequestBodyEnhancer: RequestBodyEnhancer = (_, body) => body;

type PrebuiltBotAPIStrategyInit = {
  botIdentifier: string;
  environmentEndpointURL: URL;
  // tenantID: string | undefined,
  // environmentID: string,
  getTokenCallback: () => Promise<string>;
};

export default class PrebuiltBotAPIStrategy implements TurnBasedChatAdapterAPIStrategy {
  constructor(
    { botIdentifier, environmentEndpointURL, getTokenCallback }: PrebuiltBotAPIStrategyInit,
    onRequestBody?: RequestBodyEnhancer
  ) {
    this.#botIdentifier = botIdentifier;
    this.#environmentEndpointURL = environmentEndpointURL;
    // this.#environmentID = environmentID;
    this.#getTokenCallback = getTokenCallback;
    // TODO: Do we still need onRequestBody?
    this.#onRequestBody = onRequestBody || passthruRequestBodyEnhancer;
    // this.#tenantID = tenantID;
  }

  #botIdentifier: string;
  #environmentEndpointURL: URL;
  // #environmentID: string;
  #getTokenCallback: () => Promise<string>;
  #onRequestBody: RequestBodyEnhancer;
  // #tenantID: string | undefined;

  public async getHeaders() {
    return { Authorization: `Bearer ${await this.#getTokenCallback()}` };
  }

  // TODO: Should we change `pathSuffix` into { conversationID?: string; requestType: 'continueTurn' | 'executeTurn' | 'startNewConversation'; }?
  public async getUrl(pathSuffix: string): Promise<URL> {
    if (/^[./]/u.test(pathSuffix)) {
      throw new Error('"pathSuffix" cannot starts with a dot or slash.');
    }

    let url = new URL('/powervirtualagents/', this.#environmentEndpointURL);

    // /powervirtualagents/tenants/{tenantId}/environments/{environmentId}/prebuilt/authenticated/bots/{botIdentifier}/conversations

    // TODO: It seems tenant ID is not required or not needed. Is that true?
    // if (this.#tenantID) {
    //   url = new URL(`tenants/${this.#tenantID}/`, url);
    // }

    // TODO: We already passed environment ID as part of the host name, is environment ID still required here?
    // url = new URL(`environments/${this.#environmentID}/`, url);

    url = new URL(
      `prebuilt/authenticated/bots/${this.#botIdentifier}/${pathSuffix}?api-version=2022-03-01-preview`,
      url
    );

    return url;
  }

  public onRequestBody(requestType: 'continueTurn' | 'executeTurn' | 'startNewConversation', body: Readonly<unknown>) {
    return this.#onRequestBody(requestType, body);
  }
}
