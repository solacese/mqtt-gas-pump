/**
 * routes.js
 * Defines all routes available in this application.
 * @author Andrew Roberts
 */

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
  /**
   * If you wanted to enhance a route to have an associated sidebar, you might do something like
   *  {
        path: "/qr-code",
        exact: true,
        main: props => <QrCodeLandingPage {...props} />,
        sidebar: props => <QrCodeLandingPageSidebar {...props} />
      }
   */
];
