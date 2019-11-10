import React, { FC } from "react";
import ReactDOM from "react-dom";
import { LovenseDevicesPage } from "./pages/lovense-devices";
import { ScrapPage } from "./reconcilliation/scrap";

const routes: { [_: string]: FC } = {
  "/lovense-devices": LovenseDevicesPage,
  "/scrap": ScrapPage
};

const App: FC = () => {
  const path = document.location.pathname;
  const Route = routes[path];
  const Page = Route || Index;

  // sue me
  document.title = Route ? path.slice(1) : `teledildonics.dev`;

  return (
    <section style={{ fontFamily: "garamond", margin: "32px", fontSize: "24px" }}>
      <h1
        style={{
          marginBottom: "24px"
        }}
      >
        <a href="/">teledildonics.dev</a>/<a href={path}>{path.slice(1)}</a>
      </h1>

      <Page />
    </section>
  );
};

export const Index: FC = () => {
  return (
    <ul style={{ listStyleType: "square" }}>
      {Object.entries(routes).map(([path, page], index) => (
        <li key={index} style={{ marginTop: "16px", marginLeft: "1em" }}>
          <a href={path}>{path.slice(1)}</a>
        </li>
      ))}
    </ul>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
