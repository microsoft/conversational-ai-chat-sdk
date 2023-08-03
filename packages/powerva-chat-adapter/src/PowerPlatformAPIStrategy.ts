/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { BotContext } from './types/private/BotContext';
import type { TurnBasedChatAdapterAPIStrategy } from './types/TurnBasedChatAdapterAPIStrategy';

type RequestBodyEnhancer = TurnBasedChatAdapterAPIStrategy['onRequestBody'];

const botManagementServiceTag = 'powervamg';
const passthruRequestBodyEnhancer: RequestBodyEnhancer = (_, body) => body;

export default class PowerPlatformAPIStrategy implements TurnBasedChatAdapterAPIStrategy {
  constructor(botContext: BotContext, getTokenCallback: () => Promise<string>, onRequestBody?: RequestBodyEnhancer) {
    this.#context = botContext;
    this.#getTokenCallback = getTokenCallback;
    this.#onRequestBody = onRequestBody || passthruRequestBodyEnhancer;
  }

  #context: BotContext;
  #getTokenCallback: () => Promise<string>;
  #onRequestBody: RequestBodyEnhancer;

  public async getHeaders() {
    return { Authorization: `Bearer ${await this.#getTokenCallback()}` };
  }

  public async getUrl(pathSuffix: string): Promise<URL> {
    if (/^[./]/u.test(pathSuffix)) {
      throw new Error('"pathSuffix" cannot starts with a dot or slash.');
    }

    // https://msazure.visualstudio.com/CCI/_git/BotDesigner?path=%2Fsrc%2FInfrastructure%2FCommon%2FMicrosoft.CCI.Common%2FRouting%2FPVAServiceTags.cs&_a=contents&version=GBmaster
    const baseUrl = new URL(this.#context.islandBaseUri);

    if (baseUrl.host.startsWith(botManagementServiceTag)) {
      // remove the botManagementServiceTag
      const hostWithoutTag = baseUrl.host.substring(botManagementServiceTag.length);

      // add the runtimeServiceTag
      baseUrl.host = 'pvaruntime' + hostWithoutTag;
    }

    baseUrl.pathname = `environments/${this.#context.environmentId}/bots/${this.#context.cdsBotId}/test/${pathSuffix}`;

    return baseUrl;
  }

  public onRequestBody(requestType: 'continueTurn' | 'executeTurn' | 'startNewConversation', body: Readonly<unknown>) {
    return this.#onRequestBody(requestType, body);
  }
}
