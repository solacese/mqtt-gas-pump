/**
 * Layout.jsx
 * Main layout wrapped for the entire app that
 * sets up the header and main content to fill the entire screen.
 * @author Andrew Roberts
 */

import React from "react";
import styled from "styled-components";
import { Flex } from "./shared-components/layout";

const MainContent = styled(Flex)`
  height: calc(100vh - 70px);
  width: 100vw;
`;

function Layout({ Header, Main, ...rest}) {
  return (
    <div id="app-layout">
      <Header {...rest}/>
      <MainContent>
        <Main {...rest}/>
      </MainContent>
    </div>
  );
}

export default Layout;
