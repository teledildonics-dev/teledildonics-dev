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
export class Resolver<T = void> extends Promise<T> {
  //// TODO: YOU CAN'T EXTEND PROMISE IT'S JUST NOT POSSIBLE STOP PLEASE
  constructor() {
    super((resolve, reject) => {
      this.resolve_ = resolve;
      this.reject_ = reject;
    });
    this.then(
      _value => {
        this.settled_ = "resolved";
      },
      _error => {
        this.settled_ = "rejected";
      }
    );
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
  public asSignal(): Signal<T> {
    return this;
  }
}

export type Signal<T = void> = Resolver<T> &
  (
    | Promise<T>
    | {
        readonly settled: any;
        readonly promise: any;
      });
