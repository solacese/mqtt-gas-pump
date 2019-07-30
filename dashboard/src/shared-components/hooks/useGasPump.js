import { useState } from "react";

/**
 * useGasPump   
 * React hook that models the actions of a physical gas pump
 * 
 * direction: indicates whether the pump should count up or down   
 * initalFuelLevel: specifies the starting level of fuel   
 * logger:  where to send events
 * 
 */
function useGasPump(direction, initialFuelLevel, logger) {
  const delta = 1;
  const [currentFuelLevel, setFuelLevel] = useState(initialFuelLevel);
  const [intervalId, setIntervalId] = useState(null); // keep track of interval id so we can stop our ticker

  return {
    currentFuelLevel,
    startPump: (interval) => {
      if(!intervalId) {
        if(direction == "INCREMENT") {
          console.log("INSIDE HOOK — SETTING PUMP TO FAST");
          let intervalId = setInterval(function(){ 
            setFuelLevel(prevFuelLevel => {
              logger(`Incremented tank from ${currentFuelLevel} to ${currentFuelLevel + delta}`);
              return (prevFuelLevel + delta);
            });
          }, interval);
          setIntervalId(intervalId);
        } else {
          let intervalId = setInterval(function(){ 
            setFuelLevel(prevFuelLevel => {
              logger(`Decremented tank from ${prevFuelLevel} to ${prevFuelLevel - delta}`);
              return (prevFuelLevel - delta);
            });
          }, interval);
          setIntervalId(intervalId);
        }
      }
    },
    stopPump: () => {
      if(intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    },
    resetPump: () => {
      setFuelLevel(initialFuelLevel);
    }
  };
};

export default useGasPump;
