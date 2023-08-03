/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

// This inteface could be used outside of PPUX. Please keep it PPUX-less.

import type { IAppInsights, IDependencyTelemetry, IUserContext } from '@microsoft/applicationinsights-common';

// Notes: We are prod-importing @microsoft/applicationinsights-common, which relies on 4 packages.
//        If there are too much pollutions, we could remove this deps and copy their API signature below.

type TrackPageView = IAppInsights['trackPageView'];
type StartTrackPage = IAppInsights['startTrackPage'];
type StopTrackPage = IAppInsights['stopTrackPage'];
type TrackMetric = IAppInsights['trackMetric'];
type TrackException = IAppInsights['trackException'];
type TrackTrace = IAppInsights['trackTrace'];
// Note: We could not find this API from the @microsoft/applicationinsights-common package.
type TrackDependecyData = (
  dependency: IDependencyTelemetry,
  customProperties?: { [key: string]: unknown },
  systemProperties?: { [key: string]: unknown }
) => void;
// Note: We could not find this API from the @microsoft/applicationinsights-common package.
type Flush = (async?: boolean) => void;
type SetAuthenticatedUserContext = IUserContext['setAuthenticatedUserContext'];
type AddTelemetryInitializer = IAppInsights['addTelemetryInitializer'];

/**
 * This is the definition of a telemetry client.
 *
 * The API design is borrowed from [the official `API.md`](https://github.com/microsoft/ApplicationInsights-JS/blob/main/AISKU/API.md).
 *
 * We are basing this API from the official contract at `API.md`, not from the code. We just borrow the code from `@microsoft/applicationinsights-common` package. If there are discrepancies, the `API.md` should win.
 */
export interface TelemetryClient {
  trackPageView(...args: Parameters<TrackPageView>): ReturnType<TrackPageView>;

  /** Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops, but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view and send the event. */
  startTrackPage(...args: Parameters<StartTrackPage>): ReturnType<StartTrackPage>;

  /** Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements. The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`. */
  stopTrackPage(...args: Parameters<StopTrackPage>): ReturnType<StopTrackPage>;

  /**
   * Log a positive numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators.
   *
   * To send a single measurement, use just the first two parameters. If you take measurements very frequently, you can reduce the telemetry bandwidth by aggregating multiple measurements and sending the resulting `average` and `sampleCount` at intervals.
   */
  trackMetric(...args: Parameters<TrackMetric>): ReturnType<TrackMetric>;

  /** Log an exception you have caught. Exceptions caught by the browser are also automatically logged. */
  trackException(...args: Parameters<TrackException>): ReturnType<TrackException>;

  /** Log a diagnostic event such as entering or leaving a method. */
  trackTrace(...args: Parameters<TrackTrace>): ReturnType<TrackTrace>;

  /** Log a dependency call (for instance: ajax) */
  trackDependencyData(this: TelemetryClient, ...args: Parameters<TrackDependecyData>): ReturnType<TrackDependecyData>;

  /** Immediately send all queued telemetry. By default, it is sent async. */
  flush(...args: Parameters<Flush>): ReturnType<Flush>;

  /**
   * Set the authenticated user id and the account id. Use this when you have identified a specific signed-in user. Parameters must not contain spaces or ,;=|
   *
   * The method will only set the `authenticatedUserId` and `accountId` for all events in the current page view. To set them for all events within the whole session, you should either call this method on every page view or set `storeInCookie = true`.
   */
  setAuthenticatedUserContext(
    ...args: Parameters<SetAuthenticatedUserContext>
  ): ReturnType<SetAuthenticatedUserContext>;

  /** Adds a telemetry initializer to the collection. Telemetry initializers will be called one by one, in the order they were added, before the telemetry item is pushed for sending. If one of the telemetry initializers returns false or throws an error, then the telemetry item will not be sent. */
  addTelemetryInitializer(...args: Parameters<AddTelemetryInitializer>): ReturnType<AddTelemetryInitializer>;
}
