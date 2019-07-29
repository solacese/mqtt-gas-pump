import React, { useState, useEffect } from "react";
import { Redirect } from "react-router-dom";
import { useInput } from "../shared-components/hooks";
import Spinner from "../shared-components/Spinner";

import { MQTTClient } from "../shared-components/MQTTClient";
import  uuidv1 from "uuid/v1";


/**
 * Login component lifecycle
 * 1) Initialization
 * After scanning a QR code, the mobile application will navigate to the login page
 * with a UUID.  This UUID will act as the unique identifier for the user's session.
 *
 * 2) Prompt user input and wait for global session to start on dashboard
 * Users are presented a basic form asking for a name to represent their gas station.
 * Upon entering a valid name, they will be shown a waiting screen until
 * the Solace client receives a "start" message on a predefined system level topic
 *
 * 3) Navigate to gas station page
 * When the Solace client receives a "start" message on the provided topic, it will
 * know that the global session has started and will navigate to the gas-station page
 * with both an individual session ID (representing a single gas station) and a global
 * session ID (representing a session that is going to track each of the gas stations)
 */
function Login(props) {
  const [client, setClient] = useState(null);
  const [sessionState, setSessionState] = useState("INPUT");
  const { value: name, bind: bindNameInput } = useInput("");

  // Session ID from queryString
  const params = new URLSearchParams(props.location.search);
  const sessionId = params.get("sessionId"); // bar
  const userId = uuidv1();
  console.log("Session ID: ", sessionId);

  // initialize MQTT client only once
  useEffect(() => {
    let client = MQTTClient(
      "DEV",
      "mrrwtxvkmpdxv.messaging.solace.cloud",
      Number(20009),
      "admin",
      () => setSessionState("ACTIVE")
    );
    setClient(client);
  }, []);

  const handleSubmit = evt => {
    evt.preventDefault();
    if (name) {
      client.send("login", name);
      client.subscribe("sessionStart");
      setSessionState("WAITING");
    } else {
      alert("Please enter a valid name!");
    }
  };

  if (sessionState == "WAITING") {
    return <Spinner />;
  } else if (sessionState == "ACTIVE") {
    return (
      <Redirect to={{ pathname: "/gas-station", state: {sessionId: sessionId, name: name, userId: userId} }} />
    );
  } else {
    return (
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input type="text" {...bindNameInput} />
      </form>
    );
  }
}

export default Login;
