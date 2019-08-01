/**
 * Dashboard.jsx
 * Displays all connected stations and provides a control panel for sending command & control instructions.
 * Each station has its own fuel tank and event log, which corresponds to the fuel tank state of
 * the station's associated mobile application session.
 * @author Andrew Roberts
 */

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { SolaceClient } from "../shared-components/solace/solace-client";
import LiquidFillGauge from "react-liquid-gauge";
import Logger from "../Logger";

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

/**
 * FuelTank
 * Custom implementation of LiquidFillGauge, a prebuilt liquid gauge display built on top of D3.
 * Fuel tank color indicator changes from GREEN => YELLOW => ORANGE => RED based on the fuel level.
 * Read up on the config options here: https://github.com/trendmicro-frontend/react-liquid-gauge
 */
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
            <StationRow key={key} color={index % 2}>
              <div>{station.name}</div>
              <Button
                onClick={function stopPump() {
                  station.solaceClient.publish(
                    `${sessionId}/${station.id}/SYS`,
                    JSON.stringify({ command: "STOP" })
                  );
                }}
              >
                STOP PUMP
              </Button>
            </StationRow>
          );
        })}
    </SidePanel>
  );
}

function Dashboard(props) {
  // session state
  const [session, setSession] = useState({
    connectionDetails: null,
    sessionId: null,
    stations: {}
  });

  // set up session
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
        `${sessionId}/${stationObj.id}/*`, // subscribe on topic specific to station
        function msgReceived(message) {
          // this callback function gets triggered when the client receives a message
          // from the mobile applications.  Currently, it expects either a stop command
          // or a fuel level update.
          // - STOP COMMAND MESSAGE FORMAT: { command: "STOP" }
          // - FUEL LEVEL UPDATE MESSAGE FORMAT: { fuelLevel: num, log: string }
          let msgJson = JSON.parse(message);
          if (msgJson["command"] == "STOP") {
            setSession(function setSessionCallback(prevSession) {
              // this syntax is pretty handy in react
              // it means to preserve everything in the previous state
              // except what is explicitly specified, in this case stations and its associated logs
              return {
                ...prevSession,
                stations: {
                  ...prevSession.stations,
                  [stationObj.id]: {
                    ...prevSession.stations[stationObj.id],
                    logs: [
                      ...prevSession.stations[stationObj.id].logs,
                      `${getTimestamp()} STOP COMMAND RECEIVED!`
                    ]
                  }
                }
              };
            });
          } else {
            setSession(function setSessionCallback(prevSession) {
              return {
                ...prevSession,
                stations: {
                  ...prevSession.stations,
                  [stationObj.id]: {
                    ...prevSession.stations[stationObj.id],
                    fuelLevel: Number(msgJson.fuelLevel),
                    logs: [
                      ...prevSession.stations[stationObj.id].logs,
                      msgJson.log
                    ]
                  }
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

    setSession({
      connectionDetails: connectionDetails,
      sessionId: sessionId,
      stations: stationObjs
    });
  }, []);

  return (
    <MainContainer>
      <ControlPanel sessionId={session.sessionId} stations={session.stations} />
      <StationCardList>
        {Object.keys(session.stations)
          .sort()
          .map((key, index) => {
            let station = session.stations[key];
            return (
              <StationCard key={key}>
                <StationObject station={station} />
              </StationCard>
            );
          })}
      </StationCardList>
    </MainContainer>
  );
}

export default Dashboard;
