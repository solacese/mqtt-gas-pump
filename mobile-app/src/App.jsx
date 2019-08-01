/**
 * App.jsx
 * This component maps all the routes defined in routes.js using the layout defined in Layout.jsx
 * @author Andrew Roberts
 */

import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { routes } from "./Routes";
import Header from "./Header";
import Layout from "./Layout";

function App() {
  return (
    <Router>
      {routes.map((route, index) => (
        <Route
          key={index}
          path={route.path}
          exact={route.exact}
          render={props => (
            <Layout
              {...props}
              Header={Header}
              Main={route.main}
            />
          )}
        />
      ))}
    </Router>
  );
}

export default App;
