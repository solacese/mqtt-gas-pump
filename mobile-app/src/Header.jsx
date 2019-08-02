/**
 * Header.jsx
 * @author Andrew Roberts
 */

import React from "react";
import styled from "styled-components";
import { SvgSolaceLogo } from "../public/icons";

const HeaderContainer = styled.div`
  align-items: center;
  border-bottom: 1px solid #ccc;
  display: flex;
  height: 70px;
`;

const HeaderLogo = styled(SvgSolaceLogo)`
  height: 50px;
  margin-left: 10px;
`;

const HeaderTitle = styled.h3`
  margin-left: 10px;
  align-items: center;
`;

function Header(){
  return (
    <HeaderContainer>
      <HeaderLogo/>
      <HeaderTitle>MQTT Gas Station</HeaderTitle>
    </HeaderContainer>
  );
}

export default Header;
