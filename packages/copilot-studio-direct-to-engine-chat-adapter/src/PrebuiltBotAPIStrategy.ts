/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import {
  UUID_REGEX,
  never,
  object,
  regex,
  special,
  string,
  union,
  value,
  type Output,
  type SpecialSchema,
  type StringSchema
} from 'valibot';
import { type HalfDuplexChatAdapterAPIStrategy } from './private/types/HalfDuplexChatAdapterAPIStrategy';
import { Transport } from './types/Transport';

const PrebuiltBotAPIStrategyInitSchema = () =>
  object(
    {
      botIdentifier: string([regex(UUID_REGEX)]),
      environmentEndpointURL: special(input => input instanceof URL) as SpecialSchema<URL>,
      getTokenCallback: special(input => typeof input === 'function') as SpecialSchema<() => Promise<string>>,
      transport: union([
        string([value('rest')]) as StringSchema<'rest'>,
        string([value('server sent events')]) as StringSchema<'server sent events'>
      ])
    },
    never()
  );

type PrebuiltBotAPIStrategyInit = Output<ReturnType<typeof PrebuiltBotAPIStrategyInitSchema>>;

const API_VERSION = '2022-03-01-preview';

export default class PublishedBotAPIStrategy implements HalfDuplexChatAdapterAPIStrategy {
  constructor({ botIdentifier, environmentEndpointURL, getTokenCallback, transport }: PrebuiltBotAPIStrategyInit) {
    this.#getTokenCallback = getTokenCallback;
    this.#transport = transport;

    const url = new URL(`/powervirtualagents/prebuilt/authenticated/bots/${botIdentifier}/`, environmentEndpointURL);

    url.searchParams.set('api-version', API_VERSION);

    this.#baseURL = url;
  }

  #baseURL: URL;
  #getTokenCallback: () => Promise<string>;
  #transport: Transport;

  async #getHeaders() {
    return { authorization: `Bearer ${await this.#getTokenCallback()}` };
  }

  public async prepareExecuteTurn(): ReturnType<HalfDuplexChatAdapterAPIStrategy['prepareExecuteTurn']> {
    return { baseURL: this.#baseURL, headers: await this.#getHeaders(), transport: this.#transport };
  }

  public async prepareStartNewConversation(): ReturnType<
    HalfDuplexChatAdapterAPIStrategy['prepareStartNewConversation']
  > {
    return { baseURL: this.#baseURL, headers: await this.#getHeaders(), transport: this.#transport };
  }
}
