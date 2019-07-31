import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { SolaceClient } from "../shared-components/solace/solace-client";
import LiquidFillGauge from "react-liquid-gauge";
import Logger from "../Logger";
import { Flex } from "../shared-components/layout";

/**
 * Styling
 */

const Button = styled.button`
  background-color: #f44336;
  border: none;
  color: white;
  display: inline-block;
  font-size: 0.8em;
  padding: 10px 20px;
  text-align: center;
`;

const MainContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const SidePanel = styled.div`
  height: calc(100% - 25px);
  margin-top: 25px;
  overflow: scroll;
  width: 450px;
`;

const SidePanelTitle = styled.div`
  font-size: 1.4em;
  margin-bottom: 10px;
`;

const StationCard = styled.div`
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  height: 300px;
  width: 300px;
  padding: 20px;
`;

const StationCardList = styled.div`
  column-gap: 25px;
  display: flex;
  flex-wrap: wrap;
  height: calc(100% - 25px);
  margin-top: 25px;
  margin-left: 25px;
  overflow: scroll;
  row-gap: 25px;
  width: calc(100% - 450px);
`;

const StationContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StationTitle = styled.div`
  font-size: 1.4em;
  margin-bottom: 10px;
`;

const StationRow = styled.div`
  align-items: center;
  background: ${props => (props.color === 0 ? "#FFFFFF" : "#f0f0f0")};
  display: flex;
  font-size: 1.1em;
  justify-content: space-between;
  padding: 10px;
`;

const LoggerContainer = styled.div`
  height: 75px;
  margin-top: 10px;
  width: 300px;
`;

const LoggerTitle = styled.div`
  border-bottom: 1px solid #000000;
  font-weight: bold;
  margin-bottom: 10px;
`;

/**
 * Components
 */

function getTimestamp() {
  var now = new Date();
  var time = [
    ("0" + now.getHours()).slice(-2),
    ("0" + now.getMinutes()).slice(-2),
    ("0" + now.getSeconds()).slice(-2)
  ];
  var timestamp = "[" + time.join(":") + "] ";
  return timestamp;
}

function FuelTank({ fuelLevel, radius }) {
  // color configuration
  let fillColor;
  if (fuelLevel < 25) {
    fillColor = "#fe0000"; // red
  } else if (fuelLevel < 50) {
    fillColor = "#f77b00"; // orange
  } else if (fuelLevel < 75) {
    fillColor = "#ffde00"; // yellow
  } else {
    fillColor = "#0ab28a"; // Solace green 🎉
  }

  return (
    <LiquidFillGauge
      style={{ margin: "0 auto" }}
      width={radius}
      height={radius}
      value={fuelLevel}
      textRenderer={() => {
        return <tspan>{`${Math.round(fuelLevel)}%`}</tspan>;
      }}
      riseAnimation
      waveAnimation
      waveFrequency={2}
      waveAmplitude={2}
      circleStyle={{
        fill: "#000000"
      }}
      waveStyle={{
        fill: fillColor
      }}
      textStyle={{
        fill: "#000000",
        fontSize: "2em"
      }}
      waveTextStyle={{
        fill: "#000000",
        fontSize: "2em"
      }}
      // circle width and margin
      innerRadius={0.97}
      outerRadius={1}
    />
  );
}

function StationObject({ station }) {
  return (
    <StationContainer>
      <StationTitle>{station.name}</StationTitle>
      <FuelTank fuelLevel={station.fuelLevel} radius={150} />
      <LoggerContainer>
        <LoggerTitle>Event log</LoggerTitle>
        <Logger logList={station.logs} />
      </LoggerContainer>
    </StationContainer>
  );
}

function ControlPanel({ sessionId, stations }) {
  return (
    <SidePanel>
      <SidePanelTitle>Control Panel</SidePanelTitle>
      {Object.keys(stations)
        .sort()
        .map((key, index) => {
          let station = stations[key];
          return (
            <StationRow color={index % 2}>
              <div>{station.name}</div>
              <Button onClick={function stopPump() {
                console.log(`SENDING MESSAGE TO ${sessionId}/${station.id}/SYS`)
                station.solaceClient.publish(
                  `${sessionId}/${station.id}/SYS`,
                  JSON.stringify({ command: "STOP" })
                );
              }}>STOP PUMP</Button>
            </StationRow>
          );
        })}
    </SidePanel>
  );
}

function Dashboard(props) {
  // state
  const [connectionDetails, setConnectionDetails] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [stations, setStations] = useState({});

  // get state from navigation, initialize solace clients for stations
  useEffect(() => {
    const connectionDetails = props.location.state.connectionDetails;
    const sessionId = props.location.state.sessionId;
    const stations = props.location.state.stations;
    console.log("===== STATE =====");
    console.log("connectionDetails: ", connectionDetails);
    console.log("sessionId: ", sessionId);
    console.log("stations: ", stations);
    console.log("=================");

    // initialize a solace client for every station
    let stationObjs = {};
    for (let stationId in stations) {
      let stationObj = stations[stationId];
      let solaceClient = SolaceClient(
        connectionDetails,
        `${sessionId}/${stationObj.id}/*`, // subscribe on station specific topic
        function msgReceived(message) {
          let msgJson = JSON.parse(message);
          if(msgJson["command"]=="STOP"){
            setStations(prevStations => {
              return {
                ...prevStations,
                [stationObj.id]: {
                  ...prevStations[stationObj.id],
                  logs: [...prevStations[stationObj.id].logs, `${getTimestamp()} STOP COMMAND RECEIVED!`]
                }
              };
            });
          } else{
            setStations(prevStations => {
              return {
                ...prevStations,
                [stationObj.id]: {
                  ...prevStations[stationObj.id],
                  fuelLevel: Number(msgJson.fuelLevel),
                  logs: [...prevStations[stationObj.id].logs, msgJson.log]
                }
              };
            });
          }

        }
      );
      solaceClient.connectToSolace();
      stationObj["solaceClient"] = solaceClient;
      stationObj["fuelLevel"] = 100;
      stationObj["logs"] = [];
      stationObjs[stationId] = stationObj;
    }

    setConnectionDetails(connectionDetails);
    setSessionId(sessionId);
    setStations(stationObjs);
  }, []);

  return (
    <MainContainer>
      <ControlPanel sessionId={sessionId} stations={stations} />
      <StationCardList>
        {Object.keys(stations)
          .sort()
          .map((key, index) => {
            let station = stations[key];
            return (
              <StationCard>
                <StationObject station={station} />
              </StationCard>
            );
          })}
      </StationCardList>
    </MainContainer>
  );
}

export default Dashboard;
