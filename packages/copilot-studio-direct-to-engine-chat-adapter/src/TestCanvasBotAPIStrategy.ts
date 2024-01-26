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

const TestCanvasBotAPIStrategyInitSchema = () =>
  object(
    {
      botId: string([regex(UUID_REGEX)]),
      environmentId: string([regex(UUID_REGEX)]),
      getTokenCallback: special(input => typeof input === 'function') as SpecialSchema<() => Promise<string>>,
      islandURI: special(input => input instanceof URL) as SpecialSchema<URL>,
      transport: union([
        string([value('rest')]) as StringSchema<'rest'>,
        string([value('server sent events')]) as StringSchema<'server sent events'>
      ])
    },
    never()
  );

type TestCanvasBotAPIStrategyInit = Output<ReturnType<typeof TestCanvasBotAPIStrategyInitSchema>>;

export default class TestCanvasBotAPIStrategy implements HalfDuplexChatAdapterAPIStrategy {
  constructor({ botId, islandURI, environmentId, getTokenCallback, transport }: TestCanvasBotAPIStrategyInit) {
    this.#getTokenCallback = getTokenCallback;

    this.#baseURL = new URL(`/environments/${encodeURI(environmentId)}/bots/${encodeURI(botId)}/test/`, islandURI);
    this.#transport = transport;
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
