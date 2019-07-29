import React from "react";
import styled from "styled-components";

const HeaderContainer = styled.div`
  align-items: center;
  display: flex;
  height: 70px;
`;

// const HeaderLogo = styled(SvgPetroCanadaLogo)`
//   height: 100px;
//   width: 100px;
// `;

const HeaderTitle = styled.h3`
  margin-left: 10px;
`;

function Header(){
  return (
    <HeaderContainer>
      {/* <HeaderLogo/> */}
      <HeaderTitle>Solace Powered Gas Station Demo</HeaderTitle>
    </HeaderContainer>
  );
}

export default Header;
