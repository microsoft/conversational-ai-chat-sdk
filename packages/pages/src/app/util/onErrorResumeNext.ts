function onErrorResumeNext<T>(fn: () => T): T | undefined;
function onErrorResumeNext<T>(fn: () => T, defaultValue: T): T;
function onErrorResumeNext<T>(fn: () => T, defaultValue?: T) {
  try {
    return fn();
  } catch (error) {
    return defaultValue;
  }
}

export default onErrorResumeNext;
