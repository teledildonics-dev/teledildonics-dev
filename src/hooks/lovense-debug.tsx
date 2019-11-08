import { useEffect } from "react";
import Lovense from "../lovense/lovense";
import { unsafe } from "../common/safety";

export const useLovenseDebug = (lovense: Lovense | null) => {
  useEffect(() => {
    if (!lovense) {
      return;
    }

    (window as unsafe).lovense = lovense;
    (window as unsafe).call = async (command: string) =>
      lovense.call(command, async responses => {
        const { value } = await responses.read();
        return value;
      });
    console.info(
      `%c🌟%c Exported %c${lovense.deviceName()}%c as %cwindow.lovense: Lovense%c, with %cwindow.call: async (command: string) => Promise<void>%c.`,
      "font-family: sans-serif; margin-top: 16px; margin-right: 16px;",
      "font-family: sans-serif;",
      "font-family: sans-serif; color: purple;",
      "font-family: sans-serif;",
      "font-weight: bold;",
      "font-family: sans-serif;",
      "font-weight: bold;",
      " "
    );
    console.info(lovense);
    console.info(
      "%c🌟%c You may now %cawait call('DeviceType;')%c.",
      "font-family: sans-serif; margin-bottom: 16px; margin-right: 16px;",
      "font-family: sans-serif;",
      "font-weight: bold;",
      "font-family: sans-serif;"
    );
  }, [lovense]);
};
