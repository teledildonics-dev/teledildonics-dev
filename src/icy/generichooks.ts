import { useState, useEffect } from "react";
import { sleep } from "./async";

export const useSharedState = <T>(
  initialValue: T
): null | [() => T, (value: T) => void] => {
  // As if this weren't complicated enough, we need to wrap each of our
  // functions as a single-element array because if you pass a function
  // into useState()'s setters directly, it will be called to transform
  // the stored value, but we want to store the function itself.
  const [getter, setGetter] = useState<([(() => T)]) | null>(null);
  const [setter, setSetter] = useState<([((value: T) => void)]) | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    let value = initialValue;

    setGetter([() => value]);
    setSetter([
      (newValue: T) => {
        value = newValue;
      }
    ]);
  }, []);

  if (getter && setter) {
    return [getter[0], setter[0]];
  } else {
    return null;
  }
};

export const useThrottledChanges = <T extends unknown>(interval: number, value: T) => {
  /// Whether this value is currently throttled, meaning that the value has
  /// changed within the last interval ms. If throttled == true, there will be
  /// an async function, which will set throttled to false once the interval has
  /// elapsed, and check if the target value has changed and needs to be updated,
  /// which would reset the throttle.
  const throttledAccessors = useSharedState(false);

  /// The throttled value we are outputting.
  const [throttledValue, setThrottledValue] = useState<T>(value);

  /// A shared state storing the latest input value, which may not yet be
  /// reflected to the output throttledValue if we're throttled.
  const targetValueAccessors = useSharedState<T>(value);

  useEffect(() => {
    if (!(targetValueAccessors && throttledAccessors)) {
      return;
    }
    const [getTargetValue, setTargetValue] = targetValueAccessors;
    const [getThrottled, setThrottled] = throttledAccessors;

    setTargetValue(value);

    if (!getThrottled()) {
      setThrottled(true);
      setThrottledValue(value);

      const checkAsync = async (initialValue: T) => {
        await sleep(interval);

        const latestTargetValue = getTargetValue();
        if (initialValue !== latestTargetValue) {
          setThrottledValue(latestTargetValue);
          checkAsync(latestTargetValue);
        } else {
          setThrottled(false);
        }
      };

      checkAsync(value);
    }
  }, [value, targetValueAccessors, throttledAccessors]);

  return throttledValue;
};
