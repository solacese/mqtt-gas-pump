import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { SolaceClient } from "../shared-components/solace/solace-client";
import { pubsubplus_config } from "../shared-components/solace/pubsubplus-config";
import LiquidFillGauge from "react-liquid-gauge";
import { useInput } from "../shared-components/hooks";

/**
 * Styling
 */

const MainContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const StationCard = styled.div`
  height: 100%;
  min-height: 300px;
  min-width: 300px;
  width: 100%;
`;

const StationCardList = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-column-gap: 10px;
  grid-row-gap: 10px;
  width: 100%;
`;

/**
 * Components
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
    console.log("=================")

    // initialize a solace client for every station
    let stationObjs = {};
    for (let stationId in stations) {
      let stationObj = stations[stationId];
      let solaceClient = SolaceClient(
        connectionDetails,
        `${sessionId}/${stationObj.id}/*`, // subscribe on station specific topic
        function msgReceived(message) {
          let msgJson = JSON.parse(message);
          setStations(prevStations => {
            return (
              {
                ...prevStations,
                [stationObj.id]: {
                  ...prevStations[stationObj.id],
                  fuelLevel: Number(msgJson.fuelLevel)
                }
              }
            );
          }
          );
        }
      );
      solaceClient.connectToSolace();
      stationObj["solaceClient"] = solaceClient;
      stationObj["fuelLevel"] = 100;
      stationObjs[stationId] = stationObj;
    }

    setConnectionDetails(connectionDetails);
    setSessionId(sessionId);
    setStations(stationObjs);
  }, []);

  return (
    <MainContainer>
      <StationCardList>
        {
          Object.keys(stations).map((key, index) => {
            let station = stations[key];
            return (
              <StationCard>
                {`${station.name}`}
                <FuelTank fuelLevel={station.fuelLevel} radius={200} />
              </StationCard>
            );
          })          
        }
      </StationCardList>
    </MainContainer>
  );
}

export default Dashboard;
