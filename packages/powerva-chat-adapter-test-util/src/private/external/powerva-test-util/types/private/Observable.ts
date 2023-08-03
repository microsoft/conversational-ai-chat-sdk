/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

// This is an intentional minimal dupe of Observable typings from @microsoft/powerva-util.
//
// We cannot reference to @microsoft/powerva-util because Rush does not support circular dependency.

type CompleteFunction = () => void;
type ErrorFunction = (reason: unknown) => void;
type NextFunction<T> = (value: T) => void;

export interface Observer<T> {
  complete?: CompleteFunction;
  error?: ErrorFunction;
  next?: NextFunction<T>;
  start?: (subscription: Subscription) => void;
}

export interface SubscriptionObserver<T> {
  complete: CompleteFunction;
  error: ErrorFunction;
  next: NextFunction<T>;
  get closed(): boolean;
}

export interface Subscription {
  unsubscribe(): void;
  get closed(): boolean;
}
