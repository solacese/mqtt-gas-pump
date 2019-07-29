import React, { useState, useRef } from "react";
import styled from "styled-components";
import { List, AutoSizer } from "react-virtualized";

/**
 * Styling
 */

const Container = styled.div`
  height: 100%;
  padding-bottom: 10px;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const Log = styled.div`
  font-size: 0.75em;
`;

const Row = styled.div``;

/**
 * Logic
 */

function Logger({ logList }) {
  return (
    <Container>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            rowHeight={20}
            rowCount={logList.length}
            scrollToAlignment="end"
            scrollToIndex={logList.length - 1}
            noRowsRenderer={() => <></>}
            rowRenderer={({ index, key, style }) => (
              <Row key={key} style={style} rowIndex={index}>
                <FlexRow>
                  <Log>{logList[index]}</Log>
                </FlexRow>
              </Row>
            )}
          />
        )}
      </AutoSizer>
    </Container>
  );
}

export default Logger;