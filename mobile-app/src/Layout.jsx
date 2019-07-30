import React from "react";
import styled from "styled-components";
import { Flex } from "./shared-components/layout";

const MainContent = styled(Flex)`
  height: calc(100vh - 70px);
  width: 100vw;
`;

function Layout({ Header, Main, ...rest}) {
  console.log(rest);
  return (
    <div id="app-layout">
      <Header/>
      <MainContent>
        <Main {...rest}/>
      </MainContent>
    </div>
  );
}

export default Layout;
