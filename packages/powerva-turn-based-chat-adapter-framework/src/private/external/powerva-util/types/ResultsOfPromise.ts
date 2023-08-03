/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

export type ResultOfPromise<T> = T extends Promise<infer R> ? R : T extends PromiseLike<infer R> ? R : T;
