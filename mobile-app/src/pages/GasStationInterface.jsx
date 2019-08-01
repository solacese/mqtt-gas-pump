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
import { useLogger } from "../shared-components/hooks";
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
var flowState = "STOP";
var flowRatePerSec = 1;
var cycleCounter = false;

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
  /**
   * STATE
   */
  // session details
  const [sessionId, setSessionId] = useState(null);
  const [stationId, setStationId] = useState(null);
  const [stationName, setStationName] = useState(null);
  // MQTT client
  const [client, setClient] = useState(null);
  // logger
  const { logs, log } = useLogger([]);
  // fuel tank state
  const [delay, setDelay] = useState(1000);
  const [isRunning, setIsRunning] = useState(true);
  const [currentFuelLevel, setFuelLevel] = useState(100);

  useInterval(() => {
    setCount(count + 1);
  }, isRunning ? delay : null);

  useEffect(() => {
    // 
    const sessionId = props.location.state.sessionId;
    const stationId = props.location.state.stationId;
    const stationName = props.location.state.name;
    let sessionConfig = {stationId: stationId, sessionId: sessionId};
    // initialize MQTT client 
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
  }, []);

  /* component logic */


  // fuel tank logic

  const [intervalId, setIntervalId] = useState(null);
  //const [ flowState, setFlowState ] = useState("STOP");
  //const [ cycleCounter, setCycleCounter ] = useState(false);

  useEffect(() => {
    if (client && !intervalId) {
      let intervalId = setInterval(function() {
        if (flowState == "SLOW") {
          if (cycleCounter) {
            setFuelLevel(prevFuelLevel => {
              // tried using a hook but it ended up adding dumb complexity, change this
              if (prevFuelLevel - flowRatePerSec > 0) {
                let newLog = `Decremented tank from ${prevFuelLevel} to ${prevFuelLevel -
                  flowRatePerSec}`;
                log(newLog);
                let logWithTimestamp = `${getTimestamp()} ${newLog}`;
                client.send(
                  `${sessionId}/${stationId}/flow`,
                  JSON.stringify({
                    fuelLevel: prevFuelLevel - flowRatePerSec,
                    log: logWithTimestamp
                  })
                );
                return prevFuelLevel - flowRatePerSec;
              } else {
                let newLog = `Tank is EMPTY!`;
                log(newLog);
                let logWithTimestamp = `${getTimestamp()} ${newLog}`;
                client.send(
                  `${sessionId}/${stationId}/flow`,
                  JSON.stringify({ fuelLevel: 0, log: logWithTimestamp })
                );
                return 0;
              }
            });
            cycleCounter = false;
          } else {
            cycleCounter = true;
          }
        }
        if (flowState == "FAST") {
          setFuelLevel(prevFuelLevel => {
            if (prevFuelLevel - flowRatePerSec > 0) {
              let newLog = `Decremented tank from ${prevFuelLevel} to ${prevFuelLevel -
                flowRatePerSec}`;
              log(newLog);
              let logWithTimestamp = `${getTimestamp()} ${newLog}`;
              client.send(
                `${sessionId}/${stationId}/flow`,
                JSON.stringify({
                  fuelLevel: prevFuelLevel - flowRatePerSec,
                  log: logWithTimestamp
                })
              );
              return prevFuelLevel - flowRatePerSec;
            } else {
              let newLog = `Tank is EMPTY!`;
              log(newLog);
              let logWithTimestamp = `${getTimestamp()} ${newLog}`;
              client.send(
                `${sessionId}/${stationId}/flow`,
                JSON.stringify({ fuelLevel: 0, log: logWithTimestamp })
              );
              return 0;
            }
          });
        }
      }, 500);
      setIntervalId(intervalId);
    }
  }, [client]);

  if (window.DeviceMotionEvent) {
    window.addEventListener("deviceorientation", function handleOrientation(
      event
    ) {
      // we only care about left/right rotations, around the z-axis
      let alpha = event.alpha;

      // STOP FLOWSTATE
      if (alpha > 0 && alpha < 30) {
        if (flowState != "STOP") {
          flowState = "STOP";
          //setFlowState("STOP");
        }
      }
      // SLOW FLOWSTATE:
      // abs(30 degree)threshhold crossed: we want the tank to pour at 1%/sec
      if (alpha > 30 && alpha < 90) {
        if (flowState != "SLOW") {
          flowState = "SLOW";
          //setFlowState("SLOW");
        }
      }
      // FAST FLOWSTATE:
      // abs(90 degree) threshhold crossed: we want the tank to pour at 1%/half sec
      if (alpha > 90 && alpha < 180) {
        if (flowState != "FAST") {
          flowState = "FAST";
          //setFlowState("FAST");
        }
      }
    });
  }

  return (
    <MainContainer>
      <StationTitle>{stationName}</StationTitle>
      <FuelTankDiagram>
        <SvgGasStationDiagram height={"300px"} />
        <FuelTankOverlay>
          <FuelTank radius={115} fuelLevel={currentFuelLevel} />
        </FuelTankOverlay>
      </FuelTankDiagram>
      <ButtonBar>
        <Button
          color={"#4CAF50"}
          onClick={() => {
            flowState = "SLOW";
          }}
        >
          START
        </Button>
        <Button
          color={"#f44336"}
          onClick={() => {
            flowState = "STOP";
          }}
        >
          STOP
        </Button>
      </ButtonBar>
      <LoggerContainer>
        <LoggerTitle>Event log</LoggerTitle>
        <Logger logList={logs} />
      </LoggerContainer>
    </MainContainer>
  );
}

export default GasStationInterface;
