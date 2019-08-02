/**
 * GasPumpInterface.jsx
 * This component mimics the behavior of a gas pump by detecting device orientation detection and
 * managing a virtual fuel tank's state.  All messages sent by this component are consumed
 * by the parent dashboard application.
 * @author Andrew Roberts
 */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Logger from "../shared-components/Logger";
import { useInterval } from "../shared-components/hooks";
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

function GasStationInterface(props) {
  // session state
  const [session, setSession] = useState({
    mqttClient: null,
    sessionId: null,
    stationId: null,
    stationName: null
  });
  // fuel tank state
  const [flowSpeed, setFlowSpeed] = useState("STOP"); // STOP || SLOW || FAST
  const [fuelTankState, setFuelTankState] = useState({
    flowRatePerSec: 1,
    fuelLevel: 100,
    logs: []
  });

  // set up session
  useEffect(() => {
    // get session config details from navigation props
    const sessionId = props.location.state.sessionId;
    const stationId = props.location.state.stationId;
    const stationName = props.location.state.name;
    const sessionConfig = { stationId: stationId, sessionId: sessionId };
    // initialize MQTT client
    let client = MQTTClient(
      mqtt_config.mqtt_host,
      Number(mqtt_config.mqtt_port),
      sessionConfig,
      function messageReceived() {
        // right now, we're only supporting sending STOP commands to the mobile app
        // If you'd like to extend this demo and include more controls,
        // add some conditionals here (e.g. if(msg.command == "START"){...} )
        setFuelTankState(function setFuelTankStateCallback(prevFuelTankState) {
          return {
            ...prevFuelTankState,
            isPumping: false,
            logs: [
              ...prevFuelTankState.logs,
              `${getTimestamp()} STOP COMMAND RECEIVED!`
            ]
          };
        });
      }
    );

    setSession({
      mqttClient: client,
      sessionId: sessionId,
      stationId: stationId,
      stationName: stationName
    });
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
        if(flowSpeed!="STOP") {
          setFlowSpeed("STOP");
        }
      }
      // phone is between 30 and 90 degrees, tick 1% every second
      if (alpha > 30 && alpha < 90) {
        if(flowSpeed!="SLOW") {
          setFlowSpeed("SLOW");
        }
      }
      // phone is between 90 and 180 degrees, tick 1% every half second
      if (alpha > 90 && alpha < 180) {
        if(flowSpeed!="FAST") {
          setFlowSpeed("FAST");
        }
      }
    });
  }

  // set up fuel tank logic
  useInterval(
    function useIntervalCallback() {
      if (session.mqttClient) {
        setFuelTankState(function setFuelTankStateCallback(prevFuelTankState) {
          // get values from previous state
          let fuelLevel = prevFuelTankState.fuelLevel;
          let flowRatePerSec = prevFuelTankState.flowRatePerSec;
          let logs = prevFuelTankState.logs;
          // if the tank isn't empty, decrement
          if (fuelLevel - flowRatePerSec > 0) {
            let logWithTimestamp = `${getTimestamp()} Decremented tank from ${fuelLevel} to ${fuelLevel -
              flowRatePerSec}`;
            session.mqttClient.send(
              `${session.sessionId}/${session.stationId}/flow`,
              JSON.stringify({
                fuelLevel: fuelLevel - flowRatePerSec,
                log: logWithTimestamp
              })
            );
            // this syntax is pretty handy in react
            // it means to preserve everything in the previous state
            // except what is explicitly specified, in this case fuelLevel and logs
            return {
              ...prevFuelTankState,
              fuelLevel: fuelLevel - flowRatePerSec,
              logs: [...logs, logWithTimestamp]
            };
          } else {
            let logWithTimestamp = `${getTimestamp()} Tank is EMPTY!`;
            session.mqttClient.send(
              `${session.sessionId}/${session.stationId}/flow`,
              JSON.stringify({ fuelLevel: 0, log: logWithTimestamp })
            );
            return {
              ...prevFuelTankState,
              fuelLevel: 0,
              logs: [...logs, logWithTimestamp]
            };
          }
        });
      }
    },
    flowSpeed=="SLOW" ? 1000 : flowSpeed=="FAST" ? 500 : null
  );

  return (
    <MainContainer>
      <StationTitle>{session.stationName}</StationTitle>
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
            setFlowSpeed("SLOW");
          }}
        >
          START
        </Button>
        <Button
          color={"#f44336"}
          onClick={() => {
            setFlowSpeed("STOP");
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
