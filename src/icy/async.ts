export const sleep = async (interval: number) => {
  await new Promise(resolve => setTimeout(resolve, interval));
};

export const addTimeout = async <T>(
  value: Promise<T>,
  timeout: number,
  error: Error = new Error(`Timed out (${timeout} ms)`)
) => {
  return Promise.race([value, sleep(timeout).then(() => Promise.reject(error))]);
};
