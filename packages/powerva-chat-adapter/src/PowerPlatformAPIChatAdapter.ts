/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { ExecuteTurnContinuationAction, type TelemetryClient } from 'powerva-turn-based-chat-adapter-framework';
import pRetry from 'p-retry';

import type { ExecuteTurnResponse } from './types/private/ExecuteTurnResponse';
import type { StartResponse } from './types/private/StartResponse';
import type { TurnBasedChatAdapterAPI } from './types/TurnBasedChatAdapterAPI';
import type { TurnBasedChatAdapterAPIStrategy } from './types/TurnBasedChatAdapterAPIStrategy';
import type { Activity } from 'botframework-directlinejs';

type Init = { telemetry?: LimitedTelemetryClient };
type LimitedTelemetryClient = Pick<TelemetryClient, 'trackException'>;

const RETRY_COUNT = 4; // Will call 5 times.

/**
 * Allows case-insensitive `ExecuteTurnContinuationAction`.
 *
 * @todo 2023-04-18 [hawo]: Currently, engine returns `"continue"` (camel casing) instead of `"Continue"` (Pascal casing).
 *                          Once this is locked (say, GA), we should update `ExecuteTurnContinuationAction` and remove this function.
 * @todo 2023-07-17 [hawo]: Engine returns lowercase.
 */
function patchContinuationActionEnum(action: ExecuteTurnContinuationAction): ExecuteTurnContinuationAction {
  const actionString = action as string;

  return actionString === 'continue' || actionString === 'Continue'
    ? ExecuteTurnContinuationAction.Continue
    : ExecuteTurnContinuationAction.Waiting;
}

export default class PowerPlatformAPIChatAdapter implements TurnBasedChatAdapterAPI {
  // NOTES: This class must work over RPC and cross-domain:
  //        - If need to extends this class, only add async methods (which return Promise)
  //        - Do not add any non-async methods or properties
  //        - Do not pass any arguments that is not able to be cloned by the Structured Clone Algorithm
  //        - After modifying this class, always test with a C1-hosted PVA Anywhere Bot
  constructor(strategy: TurnBasedChatAdapterAPIStrategy, init?: Init) {
    this.#strategy = strategy;
    this.#telemetry = init?.telemetry;
  }

  #strategy: TurnBasedChatAdapterAPIStrategy;
  #telemetry: LimitedTelemetryClient | undefined;

  public async startNewConversation(
    emitStartConversationEvent: boolean,
    { signal }: { signal?: AbortSignal }
  ): Promise<StartResponse> {
    const { body, headers, url } = await this.#strategy.prepareStartNewConversation(
      Object.freeze({ emitStartConversationEvent })
    );

    const response = await this.post<StartResponse>(url, { body, headers, signal });

    response.action = patchContinuationActionEnum(response.action);

    return response;
  }

  public async executeTurn(
    conversationId: string,
    activity: Activity,
    { signal }: { signal?: AbortSignal }
  ): Promise<ExecuteTurnResponse> {
    const { body, headers, url } = await this.#strategy.prepareExecuteTurn(conversationId, Object.freeze({ activity }));

    const response = await this.post<ExecuteTurnResponse>(url, { body, headers, signal });

    response.action = patchContinuationActionEnum(response.action);

    return response;
  }

  public async continueTurn(
    conversationId: string,
    { signal }: { signal?: AbortSignal }
  ): Promise<ExecuteTurnResponse> {
    const { body, headers, url } = await this.#strategy.prepareContinueTurn(conversationId);

    const response = await this.post<ExecuteTurnResponse>(url, { body, headers, signal });

    response.action = patchContinuationActionEnum(response.action);

    return response;
  }

  private async post<TResponse>(
    url: URL,
    { body, headers, signal }: { body?: Record<string, unknown>; headers?: HeadersInit; signal?: AbortSignal }
  ): Promise<TResponse> {
    let currentResponse: Response;

    const responsePromise = pRetry(
      async () => {
        currentResponse = await fetch(url.toString(), {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { ...headers, 'Content-Type': 'application/json' },
          signal
        });

        if (!currentResponse.ok) {
          throw new Error(`Server returned ${currentResponse.status} while calling the service.`);
        }

        return currentResponse;
      },
      {
        onFailedAttempt: (error: unknown) => {
          if (currentResponse && currentResponse.status < 500) {
            throw error;
          }
        },
        retries: RETRY_COUNT,
        signal
      }
    );

    const telemetry = this.#telemetry;

    telemetry &&
      responsePromise.catch((error: unknown) => {
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

    const response = await responsePromise;

    return response.json() as unknown as TResponse;
  }
}
