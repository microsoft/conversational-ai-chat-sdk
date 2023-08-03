/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { TurnBasedChatAdapterAPI } from '../../../src/types/TurnBasedChatAdapterAPI';

type ContinueTurn = TurnBasedChatAdapterAPI['continueTurn'];
type ExecuteTurn = TurnBasedChatAdapterAPI['executeTurn'];
type StartNewConversation = TurnBasedChatAdapterAPI['startNewConversation'];

export default function mockAPI(): {
  api: TurnBasedChatAdapterAPI;
  mock: {
    continueTurn: ReturnType<typeof jest.fn<ReturnType<ContinueTurn>, Parameters<ContinueTurn>>>;
    executeTurn: ReturnType<typeof jest.fn<ReturnType<ExecuteTurn>, Parameters<ExecuteTurn>>>;
    startNewConversation: ReturnType<
      typeof jest.fn<ReturnType<StartNewConversation>, Parameters<StartNewConversation>>
    >;
  };
} {
  const continueTurn = jest.fn<ReturnType<ContinueTurn>, Parameters<ContinueTurn>>();
  const executeTurn = jest.fn<ReturnType<ExecuteTurn>, Parameters<ExecuteTurn>>();
  const startNewConversation = jest.fn<ReturnType<StartNewConversation>, Parameters<StartNewConversation>>();

  class MockAPI implements TurnBasedChatAdapterAPI {
    continueTurn = continueTurn;
    executeTurn = executeTurn;
    startNewConversation = startNewConversation;
  }

  return {
    api: new MockAPI(),
    mock: { continueTurn, executeTurn, startNewConversation }
  };
}
