export const sleep = async (interval: number) => {
  await new Promise(resolve => setTimeout(resolve, interval));
};
