import React, { useState, useEffect } from "react";
import { Redirect } from "react-router-dom";
import { useInput } from "../shared-components/hooks";
import Spinner from "../shared-components/Spinner";

import { mqtt_config } from "../shared-components/clients/mqtt-config";
import { MQTTClient } from "../shared-components/clients/MQTTClient";
import uuidv1 from "uuid/v1";

/**
 * Login component lifecycle
 * 1) Initialization
 * After scanning a QR code, the mobile application will navigate to this login page.
 * The sessionId we'll use to integrate with the dashboard will be included as a queryString.
 *
 * 2) Prompt user input and wait for session to start on dashboard
 * Users are presented a basic form asking for a name to represent their gas station.
 * Upon entering a valid name, they will be shown a waiting screen until
 * the MQTT client receives a "start" message on a predefined topic
 *
 * 3) Navigate to gas station page
 * When the MQTT client receives a "start" message on the provided topic, it will
 * know that the global session has started and will navigate to the gas-station page
 * with both a user ID (representing a single gas station) and a session ID
 */
function Login(props) {
  const [stationId, setStationId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [mqttClient, setMqttClient] = useState(null);
  const [sessionState, setSessionState] = useState("INPUT");
  const { value: name, bind: bindNameInput } = useInput("");

  // sessionId, stationId, and MQTT Client configuration
  useEffect(() => {
    let params = new URLSearchParams(props.location.search);
    let sessionId = params.get("sessionId");
    let stationId = uuidv1();
    let client = MQTTClient(
      mqtt_config.mqtt_host,
      Number(mqtt_config.mqtt_port),
      stationId,
      () => setSessionState("ACTIVE")
    );

    setStationId(stationId);
    setSessionId(sessionId);
    setMqttClient(client);
  }, []);

  const handleSubmit = evt => {
    evt.preventDefault();
    if (name) {
      let msgPayload = JSON.stringify({name: name, id: stationId})
      mqttClient.send(`${sessionId}/${mqtt_config.login_topic}`, msgPayload);
      console.log(`Subscribing to ${sessionId}/${mqtt_config.start_topic}`);
      mqttClient.subscribe(`${sessionId}/${mqtt_config.start_topic}`); // listen for start signal
      setSessionState("WAITING");
    } else {
      alert("Please enter a valid name!");
    }
  };

  if (sessionState == "INPUT") {
    return(
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input type="text" {...bindNameInput} />
      </form>
    );
  } else if (sessionState == "WAITING") {
    return <Spinner />;
  } else { // ACTIVE
    return (
      <Redirect
        to={{
          pathname: "/gas-station",
          state: { sessionId: sessionId, name: name, stationId: stationId }
        }}
      />
    );
  }
}

export default Login;
