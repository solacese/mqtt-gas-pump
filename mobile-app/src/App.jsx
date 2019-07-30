import React from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Header from "./Header";
import Layout from "./Layout";
import { routes } from "./Routes";

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
