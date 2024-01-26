/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';
import { EventSourceParserStream, type ParsedEvent } from 'eventsource-parser/stream';
import pRetry from 'p-retry';
import { type TelemetryClient } from 'powerva-turn-based-chat-adapter-framework';

import { type Transport } from '../types/Transport';
import iterateReadableStream from './iterateReadableStream';
import { parseBotResponse, type BotResponse } from './types/BotResponse';
import { type ConversationId } from './types/ConversationId';
import { type HalfDuplexChatAdapterAPI } from './types/HalfDuplexChatAdapterAPI';
import { type HalfDuplexChatAdapterAPIStrategy } from './types/HalfDuplexChatAdapterAPIStrategy';

type Init = {
  telemetry?: MinimalTelemetryClient;
};
type MinimalTelemetryClient = Pick<TelemetryClient, 'trackException'>;

const RETRY_COUNT = 4; // Will call 5 times.

function resolveURLWithQueryAndHash(relativeURL: string, baseURL: URL): URL {
  const url = new URL(relativeURL, baseURL);

  url.hash = baseURL.hash;
  url.search = baseURL.search;

  return url;
}

export default class DirectToEngineServerSentEventsChatAdapterAPI implements HalfDuplexChatAdapterAPI {
  // NOTES: This class must work over RPC and cross-domain:
  //        - If need to extends this class, only add async methods (which return Promise)
  //        - Do not add any non-async methods or properties
  //        - Do not pass any arguments that is not able to be cloned by the Structured Clone Algorithm
  //        - After modifying this class, always test with a C1-hosted PVA Anywhere Bot
  constructor(strategy: HalfDuplexChatAdapterAPIStrategy, init?: Init) {
    this.#strategy = strategy;
    this.#telemetry = init?.telemetry;
  }

  #conversationId: ConversationId | undefined = undefined;
  #strategy: HalfDuplexChatAdapterAPIStrategy;
  #telemetry: MinimalTelemetryClient | undefined;

  get conversationId(): ConversationId | undefined {
    return this.#conversationId;
  }

  public async startNewConversation(emitStartConversationEvent: boolean): Promise<AsyncIterableIterator<Activity>> {
    const { baseURL, body, headers, transport } = await this.#strategy.prepareStartNewConversation();

    const response = await this.#post(baseURL, { body: { ...body, emitStartConversationEvent }, headers, transport });

    return response;
  }

  public async executeTurn(activity: Activity): Promise<AsyncIterableIterator<Activity>> {
    if (!this.#conversationId) {
      throw new Error(`startNewConversation() must be called before executeTurn().`);
    }

    const { baseURL, body, headers, transport } = await this.#strategy.prepareExecuteTurn();

    const response = await this.#post(baseURL, { body: { ...body, activity }, headers, transport });

    return response;
  }

  async #post(
    baseURL: URL,
    { body, headers, transport }: { body?: Record<string, unknown>; headers?: HeadersInit; transport?: Transport }
  ): Promise<AsyncIterableIterator<Activity>> {
    if (transport === 'server sent events') {
      return this.#postWithServerSentEvents(baseURL, { body, headers });
    }

    return this.#postWithREST(baseURL, { body, headers });
  }

  async #postWithREST(
    baseURL: URL,
    { body, headers }: { body?: Record<string, unknown>; headers?: HeadersInit }
  ): Promise<AsyncIterableIterator<Activity>> {
    const post = async (): Promise<AsyncIterableIterator<Activity>> => {
      let currentResponse: Response;

      const initialPromise = pRetry(
        async (): Promise<BotResponse> => {
          const url = resolveURLWithQueryAndHash(`conversations/${this.#conversationId || ''}`, baseURL);

          currentResponse = await fetch(url.toString(), {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
              ...headers,
              ...(this.#conversationId ? { 'x-ms-conversationid': this.#conversationId } : {}),
              'content-type': 'application/json'
            }
          });

          if (!currentResponse.ok) {
            throw new Error(`Server returned ${currentResponse.status} while calling the service.`);
          }

          return parseBotResponse(await currentResponse.json());
        },
        {
          onFailedAttempt: (error: unknown) => {
            if (currentResponse && currentResponse.status < 500) {
              throw error;
            }
          },
          retries: RETRY_COUNT
        }
      );

      const telemetry = this.#telemetry;

      telemetry &&
        initialPromise.catch((error: unknown) => {
          // TODO [hawo]: We should rework on this telemetry for a couple of reasons:
          //              1. We did not handle it, why call it "handledAt"?
          //              2. We should indicate this error is related to the protocol
          error instanceof Error &&
            telemetry.trackException(
              { error },
              {
                handledAt: 'withRetries',
                retryCount: RETRY_COUNT + 1 + ''
              }
            );
        });

      const botResponse = await initialPromise;

      if (botResponse.conversationId) {
        this.#conversationId = botResponse.conversationId;
      }

      return (async function* (): AsyncIterableIterator<Activity> {
        for await (const activity of botResponse.activities) {
          yield activity;
        }

        if (botResponse.action === 'continue') {
          yield* await post();
        }
      })();
    };

    return post();
  }

  async #postWithServerSentEvents(
    baseURL: URL,
    { body, headers }: { body?: Record<string, unknown>; headers?: HeadersInit }
  ): Promise<AsyncIterableIterator<Activity>> {
    let currentResponse: Response;

    const responseBodyPromise = pRetry(
      async (): Promise<ReadableStream<Uint8Array>> => {
        currentResponse = await fetch(
          resolveURLWithQueryAndHash(`conversations/${this.#conversationId || ''}`, baseURL),
          {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
              ...headers,
              ...(this.#conversationId ? { 'x-ms-conversationid': this.#conversationId } : {}),
              accept: 'text/event-stream',
              'content-type': 'application/json'
            }
          }
        );

        if (!currentResponse.ok) {
          throw new Error(`Server returned ${currentResponse.status} while calling the service.`);
        }

        const contentType = currentResponse.headers.get('content-type');

        if (contentType !== 'text/event-stream') {
          throw new Error(
            `Server did not respond with content type of "text/event-stream", instead, received "${contentType}".`
          );
        } else if (!currentResponse.body) {
          throw new Error(`Server did not respond with body.`);
        }

        return currentResponse.body;
      },
      {
        onFailedAttempt: (error: unknown) => {
          if (currentResponse && currentResponse.status < 500) {
            throw error;
          }
        },
        retries: RETRY_COUNT
      }
    );

    const telemetry = this.#telemetry;

    telemetry &&
      responseBodyPromise.catch((error: unknown) => {
        // TODO [hawo]: We should rework on this telemetry for a couple of reasons:
        //              1. We did not handle it, why call it "handledAt"?
        //              2. We should indicate this error is related to the protocol
        error instanceof Error &&
          telemetry.trackException(
            { error },
            {
              handledAt: 'withRetries',
              retryCount: RETRY_COUNT + 1 + ''
            }
          );
      });

    const responseBody = await responseBodyPromise;

    return iterateReadableStream(
      responseBody
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream())
        .pipeThrough(
          new TransformStream<ParsedEvent, Activity>({
            transform: ({ data }, controller) => {
              if (data === '[DONE]') {
                controller.terminate();
              } else {
                const botResponse = parseBotResponse(JSON.parse(data));

                if (!this.#conversationId && botResponse.conversationId) {
                  this.#conversationId = botResponse.conversationId;
                }

                botResponse.activities.map(controller.enqueue.bind(controller));
              }
            }
          })
        )
    );
  }
}
