/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, ConnectionStatus } from 'botframework-directlinejs';

import type Observable from '../Observable';

export type ChatAdapter = {
  get activity$(): Observable<Readonly<Activity>>;
  get connectionStatus$(): Observable<ConnectionStatus>;

  end(): void;
  postActivity(activity: Readonly<Activity>): Observable<string>;
};
