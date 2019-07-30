import React from "react";
import { ConnectionScreen, Dashboard, QrCodeLandingPage } from "./pages";

export const routes = [
  {
    path: "/",
    exact: true,
    main: props => <ConnectionScreen {...props}/>
  },
  {
    path: "/dashboard",
    exact: true,
    main: props => <Dashboard {...props} />
  },
  {
    path: "/qr-code",
    exact: true,
    main: props => <QrCodeLandingPage {...props}/>
  }
];
