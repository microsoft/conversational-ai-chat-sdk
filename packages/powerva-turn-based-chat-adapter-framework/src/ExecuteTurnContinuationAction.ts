/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

/**
 * The action the bot should take after receiving a response from the server.
 */
enum ExecuteTurnContinuationAction {
  /**
   * The bot is waiting for user input.
   */
  Waiting = 'Waiting',

  /**
   * The bot is about to execute an asynchronous operation. The client should call PVA immediately to begin
   * execution of the async operation.
   */
  Continue = 'Continue'
}

export default ExecuteTurnContinuationAction;
