/**
 * GasPumpInterface.jsx
 * This component mimics the behavior of a gas pump by detecting device orientation detection and
 * managing a virtual fuel tank's flow state.  All messages sent by this component are consumed
 * by the parent application's dashboard.
 * @author Andrew Roberts
 */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Logger from "../shared-components/Logger";
import { useInterval, useLogger } from "../shared-components/hooks";
import { MQTTClient } from "../shared-components/clients/MQTTClient";
import { mqtt_config } from "../shared-components/clients/mqtt-config";
import LiquidFillGauge from "react-liquid-gauge";
import { SvgGasStationDiagram } from "../../public/icons";

/**
 * Styling
 */

const Button = styled.button`
  background-color: ${props => props.color};
  border: none;
  color: white;
  display: inline-block;
  font-size: 1.1em;
  margin-left: 20px;
  margin-right: 20px;
  padding: 10px 20px;
  text-align: center;
  width: 125px;
`;

const ButtonBar = styled.div`
  display: flex;
  margin-top: 10px;
`;

const MainContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-items: center;
  min-height: 100%;
  row-gap: 10px;
  width: 100%;
`;

const FuelTankDiagram = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 300px;
  margin-top: 10px;
  min-height: 30vh;
  min-width: 35vw;
  position: relative;
  width: 300px;
`;

const FuelTankOverlay = styled.div`
  bottom: 0px;
  height: 120px;
  position: absolute;
  width: 120px;
`;

const LoggerContainer = styled.div`
  height: 200px;
  margin-top: 10px;
  min-height: 30vh;
  min-width: 50vw;
  width: 325px;
`;

const LoggerTitle = styled.div`
  border-bottom: 1px solid #000000;
  font-weight: bold;
  margin-bottom: 10px;
`;

const StationTitle = styled.div`
  font-size: 1.4em;
  margin-top: 10px;
`;

/**
 * Components
 */

// gross global vars

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

function GasStationInterface(props) {
  // session details
  const [sessionId, setSessionId] = useState(null);
  const [stationId, setStationId] = useState(null);
  const [stationName, setStationName] = useState(null);
  // MQTT client
  const [client, setClient] = useState(null);
  // fuel tank state
  const [flowOptions, setFlowOptions] = useState({
    delay: 1000,
    flowRatePerSec: 1,
    isRunning: false
  });
  const [fuelTankState, setFuelTankState] = useState({
    fuelLevel: 100,
    logs: []
  });

  // set up session and MQTT client
  useEffect(() => {
    // get session config details from navigation props
    const sessionId = props.location.state.sessionId;
    const stationId = props.location.state.stationId;
    const stationName = props.location.state.name;
    // initialize MQTT client
    let sessionConfig = { stationId: stationId, sessionId: sessionId };
    let client = MQTTClient(
      mqtt_config.mqtt_host,
      Number(mqtt_config.mqtt_port),
      sessionConfig,
      function messageReceived() {
        // right now, we're only supporting sending STOP commands to the mobile app
        // If you'd like to extend this demo and include more controls,
        // add some conditionals here (e.g. if(msg.command == "START"){...} )
        flowState = "STOP";
        log("STOP COMMAND RECEIVED!");
      }
    );

    setClient(client);
    setSessionId(sessionId);
    setStationId(stationId);
    setStationName(stationName);
  }, []);

  // set up device orientation detection logic
  if (window.DeviceMotionEvent) {
    window.addEventListener("deviceorientation", function handleOrientation(
      event
    ) {
      // we only care about device rotation to the left
      // alpha === z-axis
      // some reference points:
      // 0 degrees on z-axis = phone is vertical with top facing up
      // 90 degrees on z-axis = phone horizontal with top facing to left
      // 180 degrees on z-axis = phone vertical with top facing down
      let alpha = event.alpha;

      // phone is upright, stop flow
      if (alpha < 30) {
        setFlowOptions({ ...flowOptions, delay: 1000, isRunning: false });
      }
      // phone is between 30 and 90 degrees, tick 1% every second
      if (alpha > 30 && alpha < 90) {
        setFlowOptions({ ...flowOptions, delay: 1000, isRunning: true });
      }
      // phone is between 90 and 180 degrees, tick 1% every half second
      if (alpha > 90 && alpha < 180) {
        setFlowOptions({ ...flowOptions, delay: 500, isRunning: false });
      }
    });
  }

  // set up fuel tank logic
  useInterval(
    function useIntervalCallback() {
      if (client) {
        setFuelTankState(function setFuelTankStateCallback(prevFuelTankState) {
          console.log("INSIDE SETFUEL CALLBACK", flowOptions);
          if ((prevFuelTankState.fuelLevel - flowOptions.flowRatePerSec) > 0) {
            let newLog = `Decremented tank from ${
              prevFuelTankState.fuelLevel
            } to ${prevFuelTankState.fuelLevel - flowOptions.flowRatePerSec}`;
            let logWithTimestamp = `${getTimestamp()} ${newLog}`;
            console.log("INSIDE SETFUEL CALLBACK CONDITIONAL");
            client.send(
              `${sessionId}/${stationId}/flow`,
              JSON.stringify({
                fuelLevel: prevFuelTankState.fuelLevel - flowOptions.flowRatePerSec,
                log: logWithTimestamp
              })
            );
            return {
              fuelLevel:
                prevFuelTankState.fuelLevel - flowOptions.flowRatePerSec,
              logs: [...prevFuelTankState.logs, logWithTimestamp]
            };
          } else {
            let logWithTimestamp = `${getTimestamp()} Tank is EMPTY!`;
            client.send(
              `${sessionId}/${stationId}/flow`,
              JSON.stringify({ fuelLevel: 0, log: logWithTimestamp })
            );
            return {
              fuelLevel: 0,
              logs: [...prevFuelTankState.logs, logWithTimestamp]
            };
          }
        });
      }
    },
    flowOptions.isRunning ? flowOptions.delay : null
  );

  return (
    <MainContainer>
      <StationTitle>{stationName}</StationTitle>
      <FuelTankDiagram>
        <SvgGasStationDiagram height={"300px"} />
        <FuelTankOverlay>
          <FuelTank radius={115} fuelLevel={fuelTankState.fuelLevel} />
        </FuelTankOverlay>
      </FuelTankDiagram>
      <ButtonBar>
        <Button
          color={"#4CAF50"}
          onClick={() => {
            setFlowOptions({ ...flowOptions, delay: 1000, isRunning: true });
          }}
        >
          START
        </Button>
        <Button
          color={"#f44336"}
          onClick={() => {
            setFlowOptions({ ...flowOptions, delay: 1000, isRunning: false });
          }}
        >
          STOP
        </Button>
      </ButtonBar>
      <LoggerContainer>
        <LoggerTitle>Event log</LoggerTitle>
        <Logger logList={fuelTankState.logs} />
      </LoggerContainer>
    </MainContainer>
  );
}

export default GasStationInterface;
