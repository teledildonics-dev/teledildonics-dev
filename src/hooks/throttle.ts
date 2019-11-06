import { useState, useEffect, useRef } from "react";
import { sleep } from "../common/async";

export const useThrottledChanges = <T extends unknown>(interval: number, value: T) => {
  /// Whether this value is currently throttled, meaning that the value has
  /// changed within the last interval ms. If throttled == true, there will be
  /// an async function, which will set throttled to false once the interval has
  /// elapsed, and check if the target value has changed and needs to be updated,
  /// which would reset the throttle.
  const throttled = useRef<boolean>(false);

  /// The throttled value we are outputting.
  const [throttledValue, setThrottledValue] = useState<T>(value);

  /// A shared state storing the latest input value, which may not yet be
  /// reflected to the output throttledValue if we're throttled.
  const targetValue = useRef<T>(value);

  useEffect(() => {
    targetValue.current = value;

    if (!throttled.current) {
      throttled.current = true;
      setThrottledValue(value);

      const checkAsync = async (initialValue: T) => {
        await sleep(interval);

        const latestTargetValue = targetValue.current;
        if (initialValue !== latestTargetValue) {
          setThrottledValue(latestTargetValue);
          checkAsync(latestTargetValue);
        } else {
          throttled.current = false;
        }
      };

      checkAsync(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return throttledValue;
};
