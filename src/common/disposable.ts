import { Resolver } from "./async";
export class AsyncDisposable {
  /// An Resolver that will be resolved once dispose() is called.
  private disposeStarter = new Resolver();
  protected diposeStarted = this.disposeStarter.readonly();

  /// An Resolver that will be resolved when dispose() is complete.
  private disposeCompleter = new Resolver();
  protected diposeCompleted = this.disposeCompleter.readonly();

  /// Throws an error if dispose() has been called.
  ///
  /// Subclasses should consider calling this at the beginning of every public-facing method to assert
  /// that they're never called after dispose() has been called.
  protected throwIfDisposeStarted() {
    if (this.diposeStarted.settled) {
      throw new DisposedError(this, `dispose() already called on ${this}`);
    }
  }

  /// Throws an error if dispose() has completed.
  ///
  /// Subclasses should consider calling this at the beginning of every method (unless
  /// throwIfDisposeStarted() is called), and after every await in method bodies.
  protected throwIfDisposeComplete() {
    if (this.diposeCompleted.settled) {
      throw new DisposedError(this, `dispose() already completed on ${this}`);
    }
  }

  /// A Promise for the result of a currently-running call to dispose(),
  /// if one is in progress.
  private disposal: Promise<void> | undefined;

  protected async dispose() {
    this.throwIfDisposeStarted();

    this.disposeStarter.resolve();

    if (this.disposal) {
      return this.disposal;
    }

    try {
      await this.onDispose();
    } finally {
      this.disposeCompleter.resolve();
    }
  }

  /// Dispose of all resources assoicated with this class.
  ///
  /// Inteded for subclasses to override if they need extra disposal behaviour.
  protected async onDispose(): Promise<void> {}
}

/// Error throw when you attempt to interact with an instance after dispose() was called.
export class DisposedError<T> extends Error {
  constructor(readonly instance: T, message: string = `${instance} already disposed`) {
    super(message);
  }
}
