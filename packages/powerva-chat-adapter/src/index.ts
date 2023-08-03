/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

// TODO: [hawo] When PPUX support named exports, remove this file and reference in package.json.
//              We should only offer named exports.

import fromTurnBasedChatAdapterAPI from './fromTurnBasedChatAdapterAPI';
import PowerPlatformAPIChatAdapter from './PowerPlatformAPIChatAdapter';
import PowerPlatformAPIStrategy from './PowerPlatformAPIStrategy';

import type { TurnBasedChatAdapterAPI } from './types/TurnBasedChatAdapterAPI';
import type { TurnBasedChatAdapterAPIStrategy } from './types/TurnBasedChatAdapterAPIStrategy';

// The exported members should match those in package.json.
export { PowerPlatformAPIChatAdapter, fromTurnBasedChatAdapterAPI, PowerPlatformAPIStrategy };
export type { TurnBasedChatAdapterAPI, TurnBasedChatAdapterAPIStrategy };
