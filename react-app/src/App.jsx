import React from "react";
import styled from "styled-components";
import LandingPage from "./LandingPage"

const Layout = styled.div`
  align-items: center;
  display: flex;
  height: 100vh;
  justify-content: center;
  width: 100vw;
`

function App() {
  return (
    <Layout>
      <LandingPage/>
    </Layout>
  );
}

export default App;
