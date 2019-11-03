/// Some utility functions to help manage types safely.

/// Ensures a condition is truthy, or throws.
export const assert = (condition: any, message: string = "assertion failed") => {
  if (!condition) {
    throw new Error(message);
  }
};

/// Ensures a value is not undefined and return it, or throws.
export const unwrap = <T>(
  value: T | undefined,
  message: string = "unwrapped void value"
) => {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
};

/// Returns the first item from an array or undefined.
export const first = <T>(values: Array<T>): T | undefined => {
  return values[0];
};

/// Returns the only item in an array, or throws if are zero or more than one items.
export const only = <T>(values: Array<T>): T => {
  assert(values.length === 1, "expected array to only have one value")
  return values[0];
};

/// Throws an Error if one is provided.
export const throwIf = (error: Error | null) => {
  if (error) {
    throw error;
  }
}

/// Make it clearer.
export type unsafe = any;
