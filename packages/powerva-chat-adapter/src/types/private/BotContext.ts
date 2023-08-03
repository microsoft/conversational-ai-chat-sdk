/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

export type EnvironmentId = string;
export type CdsBotId = string;

export interface BotContext {
  /**
   * AKA RuntimeEndpoint;
   */
  islandBaseUri: string;
  environmentId: EnvironmentId;
  cdsBotId: CdsBotId;
}
