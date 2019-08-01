/**
 * routes.js
 * Defines all routes available in this application.
 * @author Andrew Roberts
 */
import React from "react";
import { GasStationInterface, Login } from "./pages";

export const routes = [
  {
    path: "/login",
    exact: true,
    main: props => <Login {...props}/>
  },
  {
    path: "/gas-station",
    exact: true,
    main: props => <GasStationInterface {...props} />
  }
  /**
   * If you wanted to enhance a route to have an associated sidebar, you might do something like
   *  {
        path: "/gas-station",
        exact: true,
        main: props => <GasStationInterface {...props} />,
        sidebar: props => <GasStationInterfaceSidebar {...props} />
      }
   */
];
