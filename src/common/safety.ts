/// Some utility functions to help manage types safely.

/// Ensures a condition is truthy, or throws.
export function assert(condition: unknown, message: string = "assertion failed") {
  // TODO: use `: asserts condition` above once babel/whatever can support it

  if (condition === false || condition === null || condition === undefined) {
    throw new Error(message);
  }

  return true;
}

/// Ensures a value is not undefined and return it, or throws.
export const unwrap = <T>(
  value: T | undefined,
  message: string = "unwrapped void value"
): T => {
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
  assert(values.length === 1, "expected array to only have one value");
  return values[0];
};

/// Throws an Error if one is provided.
export const throwIf = (error: Error | null) => {
  // TODO: use `: asserts error is null` above once babel/whatever can support it
  if (error) {
    throw error;
  }
};

/// Make it clearer.
export type unsafe = any;

/// A very basic async lock using a queue. Not premptible.
export class Lock implements AsyncDestroy {
  private tail: Promise<unknown> = Promise.resolve();
  private destruction: Promise<Error> | null = null;

  async use<T>(callback: () => Promise<T>): Promise<T> {
    const result = this.tail.then(() => callback());
    // We don't want exceptions to poison the lock.
    this.tail = this.tail.then(() => result.catch(() => {}));
    return result;
  }

  /// Poisons the lock. If the lock is currently held, this will wait until
  /// it's released, but will prempt any other uses that are pending.
  async destroy(): Promise<Error> {
    if (!this.destruction) {
      this.destruction = new Promise(async resolve => {
        try {
          await this.tail;
        } catch (error) {
          return resolve(error);
        }
        return resolve(new Error("Lock destroyed"));
      });
    }

    return this.destruction;
  }
}

export interface AsyncDestroy {
  destroy(error?: Error): Promise<Error>;
}

export const freeze = Object.freeze;

export const unreachable = () => {
  throw new UnreachableError('this "can\'t" happen');
};
export class UnreachableError extends Error {}
