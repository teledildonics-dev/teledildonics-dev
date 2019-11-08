export const sleep = async (ms: number) => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

export const addTimeout = async <T>(
  value: Promise<T>,
  timeout: number,
  error: Error = new Error(`Timed out (${timeout} ms)`)
) => {
  return Promise.race([value, sleep(timeout).then(() => Promise.reject(error))]);
};
