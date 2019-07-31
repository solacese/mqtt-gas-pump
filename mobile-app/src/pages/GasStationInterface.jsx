/**
 * GasPump.jsx
 *
 * Description goes here
 *
 * @author Andrew Roberts
 */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import LiquidFillGauge from "react-liquid-gauge";
import Logger from "../Logger";
import { useWindowDimension, useLogger } from "../shared-components/hooks";
import { MQTTClient } from "../shared-components/clients/MQTTClient";
import { mqtt_config } from "../shared-components/clients/mqtt-config";

import { SvgGasStationDiagram } from "../../public/icons";

/**
 * Styling
 */

const MainContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-items: center;
  min-height: 100%;
  row-gap: 10px;
  width: 100%;
`;

const StationTitle = styled.div`
  font-size: 1.4em;
  margin-top: 10px;
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

/**
 * Components
 */

// gross global vars 
var flowState = "STOP";
var flowRatePerSec = 1;  
var cycleCounter = false;

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
  // get params from redirect
  const sessionId = props.location.state.sessionId;
  const stationName = props.location.state.name;
  const stationId = props.location.state.stationId;

  /* component logic */
  // enable logging
  const { logs, log, clearLogs } = useLogger(stationName, []);

  //MQTT client
  const [client, setClient] = useState(null);
  useEffect(() => {
    let client = MQTTClient(
      mqtt_config.mqtt_host,
      Number(mqtt_config.mqtt_port),
      stationId,
      () => console.log("RECEIVED SYS LEVEL MESSAGE")
    );
    setClient(client);
  }, []);

  // fuel tank logic
  const [ currentFuelLevel, setFuelLevel ] = useState(100);
  //const [ flowState, setFlowState ] = useState("STOP");
  //const [ cycleCounter, setCycleCounter ] = useState(false);

  useEffect(() => {
    if(client){
      setInterval(function(){ 
        if(flowState == "SLOW"){
          if(cycleCounter) {
            setFuelLevel(prevFuelLevel => {
              if((prevFuelLevel - flowRatePerSec) > 0) {
                client.send(`${sessionId}/${stationId}/flow`, JSON.stringify({fuelLevel: prevFuelLevel - flowRatePerSec}));
                log(`Decremented tank from ${prevFuelLevel} to ${prevFuelLevel - flowRatePerSec}`);
                return (prevFuelLevel - flowRatePerSec);
              } else {
                client.send(`${sessionId}/${stationId}/flow`, JSON.stringify({fuelLevel: 0}));
                log(`Tank is EMPTY!`);
                return 0;
              }
            });
            cycleCounter= false;
          } else {
            cycleCounter = true;
          }
        }
        if(flowState == "FAST"){
          setFuelLevel(prevFuelLevel => {
            if((prevFuelLevel - flowRatePerSec) > 0) {
              client.send(`${sessionId}/${stationId}/flow`, JSON.stringify({fuelLevel: prevFuelLevel - flowRatePerSec}));
              log(`Decremented tank from ${prevFuelLevel} to ${prevFuelLevel - flowRatePerSec}`);
              return (prevFuelLevel - flowRatePerSec);
            } else {
              client.send(`${sessionId}/${stationId}/flow`, JSON.stringify({fuelLevel: 0}));
              log(`Tank is EMPTY!`);
              return 0;
            }
          });
        }
      }, 500);
    }
  }, [client]);
  
  if (window.DeviceMotionEvent) {
    window.addEventListener('deviceorientation', function handleOrientation(event){
      // we only care about left/right rotations, around the z-axis
      let alpha = event.alpha;

      // STOP FLOWSTATE
      if(alpha > 0 && alpha < 30) {
        if(flowState!="STOP"){
          flowState = "STOP";
          //setFlowState("STOP");
        }
      }
      // SLOW FLOWSTATE:
      // abs(30 degree)threshhold crossed: we want the tank to pour at 1%/sec
      if(alpha > 30 && alpha < 90) {
        if(flowState!="SLOW"){
          flowState = "SLOW";
          //setFlowState("SLOW");
        }
      } 
      // FAST FLOWSTATE:
      // abs(90 degree) threshhold crossed: we want the tank to pour at 1%/half sec
      if(alpha > 90 && alpha < 180) {
        if(flowState!="FAST"){
          flowState = "FAST";
          //setFlowState("FAST");
        }
      }
    });
  }
  
  /* component styling */
  const { width, height } = useWindowDimension();
  const fuelGaugeRadius = Math.min(
    Math.round(width * 0.30),
    Math.round(height * 0.30)
  );

  return (
    <MainContainer>
      <StationTitle>{stationName}</StationTitle>
      <FuelTankDiagram onClick={() => {
        if(flowState!="STOP"){
          flowState="STOP";
        } else {
          flowState="SLOW";
        }
      }}>
        <SvgGasStationDiagram height={"300px"}/>
        <FuelTankOverlay>
          <FuelTank radius={115} fuelLevel={currentFuelLevel} />
        </FuelTankOverlay>
      </FuelTankDiagram>
      <ButtonBar>
        <Button color={"#4CAF50"} onClick={() => {flowState="SLOW"}}>START</Button>
        <Button color={"#f44336"}onClick={() => {flowState="STOP"}}>STOP</Button>
      </ButtonBar>
      <LoggerContainer>
        <LoggerTitle>
          Event log
        </LoggerTitle>
        <Logger logList={logs}/>
      </LoggerContainer>
    </MainContainer>
  );
}

export default GasStationInterface;
