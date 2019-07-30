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
];
