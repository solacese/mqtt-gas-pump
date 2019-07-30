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
import { useContainerDimension, useWindowDimension, useGasPump, useLogger } from "../shared-components/hooks";
import { SvgGasStationDiagram } from "../../public/icons";

import { MQTTClient } from "../shared-components/clients/MQTTClient";
import { mqtt_config } from "../shared-components/clients/mqtt-config";

/**
 * Styling
 */

const GasPumpContainer = styled.div`
  border: 1px solid #aaaaaa;
  display: flex;
  justify-content: center;
  position: relative;
`;

const GasPumpDiagram = styled(SvgGasStationDiagram)`
  height: 100%;
  min-height: 100%;
`;

const FuelTankOverlay = styled.div`
  bottom: 20px;
  height: 33%;
  max-width: 33%;
  position: absolute;
`;

const MainContainer = styled.div`
  display: grid;
  grid-template-rows: 10% 45% 10% 35%;
  grid-row-gap: 20px;
  justify-items: center;
  height: calc(100% - 60px);
  width: 100%;
`;

const LoggerContainer = styled.div`
  width: 100%;
`;

const Button = styled.button`
  background-color: ${props => props.color};
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  margin-left: 20px;
  margin-right: 20px;
`;

const ButtonBar = styled.div`
  display: flex;
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
  const userId = props.location.state.userId;

  /* component logic */
  // enable logging
  const { logs, log, clearLogs } = useLogger([]);

  //MQTT client
  const [client, setClient] = useState(null);
  useEffect(() => {
    let client = MQTTClient(
      mqtt_config.mqtt_host,
      Number(mqtt_config.mqtt_port),
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
              client.send(`gasStation/${sessionId}/${userId}/flow`, String(prevFuelLevel - flowRatePerSec));
              log(`Decremented tank from ${prevFuelLevel} to ${prevFuelLevel - flowRatePerSec}`);
              return (prevFuelLevel - flowRatePerSec);
            });
            cycleCounter= false;
          } else {
            cycleCounter = true;
          }
        }
        if(flowState == "FAST"){
          setFuelLevel(prevFuelLevel => {
            client.send(`gasStation/${sessionId}/${userId}/flow`, String(prevFuelLevel - flowRatePerSec));
            log(`Decremented tank from ${prevFuelLevel} to ${prevFuelLevel - flowRatePerSec}`);
            return (prevFuelLevel - flowRatePerSec);
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
  const fuelGaugeRadius = Math.round(width * 0.30)

  // do some useRef magic and find out the dimensions of the parent container
  const [diagramRef, diagramSize] = useContainerDimension();
  console.log("Diagram size from renders:", diagramSize.width, diagramSize.height);
  // Use the parent dimensions to relatively size and position the fuel tank
  // This allows us to build a responsive layout that will look nice on mobile devices
  // const fuelGaugeRadius = Math.min(
  //   Math.round(diagramSize.height * 0.45),
  //   Math.round(diagramSize.width * 0.4)
  // );
  return (
    <MainContainer>
      <p>
        {stationName}
      </p>
      <GasPumpContainer>
        <GasPumpDiagram sizingref={diagramRef}/>
        <FuelTankOverlay>
          <FuelTank radius={fuelGaugeRadius} fuelLevel={currentFuelLevel} />
        </FuelTankOverlay>
      </GasPumpContainer>
      <ButtonBar>
        <Button color={"#4CAF50"} onClick={() => {flowState="SLOW"}}>START PUMP</Button>
        <Button color={"#f44336"}onClick={() => {flowState="STOP"}}>STOP PUMP</Button>
      </ButtonBar>
      <LoggerContainer>
        {flowState}
        <Logger logList={logs}/>
      </LoggerContainer>
    </MainContainer>
  );
}

export default GasStationInterface;
