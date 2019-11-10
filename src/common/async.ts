import { unsafe } from "./safety";

export const sleep = async (ms: number) => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

export const addTimeout = async <T>(
  value: Promise<T>,
  timeout: number,
  error: Error = new TimeoutError(`Timed out (${timeout} ms)`)
) => {
  return Promise.race([value, sleep(timeout).then(() => Promise.reject(error))]);
};

export class TimeoutError extends Error {}

/// A Promise with its resolve() and reject() callbacks made public and
/// its status (but not value) synchronously available as .settled.
///
/// If no type is specified this defaults to void for use as a signal.
export class Resolver<T = void> implements PromiseLike<T> {
  constructor(
    public readonly promise: Promise<T> = new Promise((resolve, reject) => {
      this.resolve_ = resolve;
      this.reject_ = reject;
    })
  ) {
    this.then(
      _value => {
        this.settled_ = "resolved";
      },
      _error => {
        this.settled_ = "rejected";
      }
    );
  }

  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  private settled_: false | "resolved" | "rejected" = false;
  public get settled() {
    return this.settled_;
  }

  private resolve_: (value: T) => unknown = undefined as unsafe;
  public get resolve() {
    return this.resolve_;
  }

  private reject_: (value: Error) => unknown = undefined as unsafe;
  public get reject() {
    return this.reject_;
  }

  /// Type-only transformation limiting to read-only interfaces.
  public readonly(): ReadonlyResolver<T> {
    return this;
  }
}

export type ReadonlyResolver<T = void> = Resolver<T> &
  (
    | Promise<T>
    | {
        readonly settled: any;
        readonly promise: any;
      });
