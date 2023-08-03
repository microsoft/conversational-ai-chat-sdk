/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

// Adopted from https://github.com/tc39/proposal-observable.

// CoreJS is not typed and cannot be module-augmented because TypeScript says "default exports cannot be typed".
// https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation

// We are building a very simple CoreJS wrapper so we can type Observable.

// @ts-expect-error "core-js" is not typed.
import CoreJSObservable from 'core-js/features/observable';

/** Receives a completion notification */
type CompleteFunction = () => void;

/** Receives the sequence error */
type ErrorFunction = (reason: unknown) => void;

/** Receives the next value in the sequence */
type NextFunction<T> = (value: T) => void;

/** Subscribes to the observable */
type SubscriberFunction<T> = (observer: SubscriptionObserver<T>) => (() => void) | Subscription | void;

/** An `Observable` represents a sequence of values which may be observed. */
interface Observable<T> {
  /** Subscribes to the sequence with an observer */
  subscribe(observer: Observer<T>): Subscription;

  /** Subscribes to the sequence with callbacks */
  subscribe(onNext: NextFunction<T>, onError?: ErrorFunction, onComplete?: CompleteFunction): Subscription;
}

interface Subscription {
  /** A boolean value indicating whether the subscription is closed */
  get closed(): boolean;

  /** Cancels the subscription */
  unsubscribe(): void;
}

/**
 * An `Observer` is used to receive data from an `Observable`, and is supplied as an argument to `subscribe`.
 *
 * All methods are optional.
 */
interface Observer<T> {
  /** Receives a completion notification */
  complete?: CompleteFunction;

  /** Receives the sequence error */
  error?: ErrorFunction;

  /** Receives the next value in the sequence */
  next?: NextFunction<T>;

  /** Receives the subscription object when `subscribe` is called */
  start?: (subscription: Subscription) => void;
}

/** A `SubscriptionObserver` is a normalized `Observer` which wraps the observer object supplied to `subscribe`. */
interface SubscriptionObserver<T> {
  /** Sends the completion notification */
  complete: CompleteFunction;

  /** Sends the sequence error */
  error: ErrorFunction;

  /** Sends the next value in the sequence */
  next: NextFunction<T>;

  /** A boolean value indicating whether the subscription is closed */
  get closed(): boolean;
}

interface ObservableConstructor {
  readonly prototype: Observable<unknown>;
  new <T>(subscriber: SubscriberFunction<T>): Observable<T>;

  from<T>(iterable: Iterable<T>): Observable<T>;
}

class ObservableImpl<T> extends CoreJSObservable implements Observable<T> {
  constructor(subscriber: SubscriberFunction<T>) {
    super(subscriber);
  }

  public subscribe(observer: Observer<T>): Subscription;
  public subscribe(onNext: NextFunction<T>, onError?: ErrorFunction, onComplete?: CompleteFunction): Subscription;

  public subscribe(
    observerOrOnNext: Observer<T> | NextFunction<T>,
    onError?: ErrorFunction,
    onComplete?: CompleteFunction
  ): Subscription {
    return super.subscribe(observerOrOnNext, onError, onComplete);
  }

  public static from<T>(iterable: Iterable<T>): Observable<T> {
    return CoreJSObservable.from(iterable);
  }
}

// This variable name "Observable" must match the interface name "Observable".
// This is a technique for creating static interface.
// eslint-disable-next-line @typescript-eslint/no-redeclare
const Observable: ObservableConstructor = ObservableImpl as ObservableConstructor;

export default Observable;

// Note [hawo]: Exporting "SubscriberFunction" because I am unsure how to infer it from Observable.
//              Once we figure out how to infer it, will be removed.
export type { SubscriberFunction };
