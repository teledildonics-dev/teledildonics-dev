/// Runs a handler function with an ReadableStream that will yield all
/// events of the specified type that occur while the handler function
/// is running.
export const withEventStream = async <EventValue, Result>(
  target: EventTarget,
  eventName: string,
  eventMapper: (event: Event) => EventValue,
  handler: (responses: ReadableStreamReader<EventValue>) => Result
): Promise<Result> => {
  let listener: undefined | ((event: Event) => void);

  const stream = new ReadableStream({
    start(controller) {
      target.addEventListener(
        eventName,
        (listener = (event: Event) => {
          controller.enqueue(eventMapper(event));
        })
      );
    },

    cancel() {
      target.removeEventListener(eventName, listener!);
    }
  });

  const reader = stream.getReader();
  try {
    return await handler(reader);
  } finally {
    reader.releaseLock();
    stream.cancel();
  }
};
