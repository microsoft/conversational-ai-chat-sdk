/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Transport } from '../../types/Transport';

type PartialRequestInit = {
  baseURL: URL;
  body?: Record<string, unknown>;
  headers?: HeadersInit;
  transport?: Transport;
};

export interface HalfDuplexChatAdapterAPIStrategy {
  prepareExecuteTurn(): Promise<PartialRequestInit>;
  prepareStartNewConversation(): Promise<PartialRequestInit>;
}
