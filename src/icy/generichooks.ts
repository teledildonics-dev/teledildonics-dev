import { useState, useEffect } from "react";
import { sleep } from "./async";

export const useSharedState = <T>(
  initialValue: T
): null | [() => T, (value: T) => void] => {
  const [getter, setGetter] = useState<(() => T) | null>(null);
  const [setter, setSetter] = useState<((value: T) => void) | null>(null);

  useEffect(() => {
    let value = initialValue;

    setGetter(() => value);
    setSetter((newValue: T) => {
      value = newValue;
    });
  }, []);

  if (getter && setter) {
    return [getter, setter];
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
  const [throttled, setThrottled] = useState(false);

  /// The throttled value we are outputting.
  const [throttledValue, setThrottledValue] = useState<T>(value);

  /// A shared state storing the latest input value, which may not yet be
  /// reflected to the output throttledValue if we're throttled.
  const targetValueAccessors = useSharedState<T>(value);

  useEffect(() => {
    if (!targetValueAccessors) {
      return;
    }
    const [getTargetValue, setTargetValue] = targetValueAccessors;

    setTargetValue(value);

    if (!throttled) {
      setThrottled(true);
      setThrottledValue(value);

      const setAsyncCheck = async (initialValue: T) => {
        await sleep(interval);

        const latestTargetValue = getTargetValue();
        if (initialValue !== latestTargetValue) {
          setThrottledValue(latestTargetValue);
          setAsyncCheck(latestTargetValue);
        } else {
          setThrottled(false);
        }
      };

      setAsyncCheck(value);
    }
  }, [value, targetValueAccessors]);

  return throttledValue;
};
