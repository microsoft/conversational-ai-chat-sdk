/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { Activity } from 'botframework-directlinejs';

export default function createActivity(text: string): Activity {
  return { from: { id: 'u-00001' }, text, type: 'message' };
}
