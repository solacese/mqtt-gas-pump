import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Redirect } from "react-router-dom";
import { SolaceClient } from "../shared-components/solace/solace-client";
import { pubsubplus_config } from "../shared-components/solace/pubsubplus-config";
import { useInput } from "../shared-components/hooks";

/**
 * Styling
 */
const Container = styled.div`
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: #000000;
  color: #00cb95;
  display: flex;
  height: 100%;
  width: 100%;
`;

const Button = styled.button`
  background-color: #4caf50;
  border: none;
  color: white;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  padding: 20px;
  text-align: center;
  text-decoration: none;
`;

const Title = styled.h1`
  display: flex;
  justify-content: center;
`;

/**
 * Components
 */

function QRImage({ session }) {
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?data=${session}&amp;size=200x200&amp;color=00CB95&amp;bgcolor=333333>`}
    />
  );
}

function QRCodeLandingPage(props) {
  // state
  const [connectionDetails, setConnectionDetails] = useState(pubsubplus_config);
  const [sessionState, setSessionState] = useState("WAITING");
  const [sessionId, setSessionId] = useState(null);
  const [loginUrl, setLoginUrl] = useState(null);
  const [solaceClient, setSolaceClient] = useState(null);
  const [stations, setStations] = useState({});
  const [stationsLength, setStationsLength] = useState(0);
  const [btnDashboardDisabled, setButtonDashboardDisabled] = useState(true);

  useEffect(() => {
    // get connection details that were entered on the connection screen
    const connectionDetails = props.location.state.connectionDetails;
    console.log("Connection details: ", connectionDetails);

    // set up the session
    let sessionId = ((Math.random() * 0xffffff) << 0).toString(16);
    let sessionUrl = `http://sunco-gas-station-demo-mobile.s3-website-us-east-1.amazonaws.com/login?sessionId=${sessionId}`;
    let solaceClient = SolaceClient(
      connectionDetails,
      `${sessionId}/${pubsubplus_config.login_topic}`,
      function loginPump(message) {
        let loginMessage = JSON.parse(message);
        setStations(prevStations => ({
          ...prevStations,
          [loginMessage.id]: {
            ...prevStations[loginMessage.id],
            name: loginMessage.name,
            id: loginMessage.id
          }
        }));
        setButtonDashboardDisabled(false);
        setStationsLength(prevStationsLength => prevStationsLength + 1);
      }
    );
    solaceClient.connectToSolace();

    // store variables
    setConnectionDetails(connectionDetails);
    setSessionId(sessionId);
    setLoginUrl(sessionUrl);
    setSolaceClient(solaceClient);
  }, []);

  // if the session has been started, navigate to the dashboard
  if (sessionState == "STARTED") {
    return (
      <Redirect
        to={{
          pathname: "/dashboard",
          state: {
            connectionDetails: connectionDetails,
            sessionId: sessionId,
            stations: stations
          }
        }}
      />
    );
  }
  // state initialized in "waiting" state while stations connect
  else {
    return (
      <Container>
        <Title>Solace MQTT Gas Pump Demo</Title>
        <QRImage session={loginUrl} />
        <p>
          Scan QR Code with your mobile phone to turn it into a gas station!
        </p>
        <Button
          disabled={btnDashboardDisabled}
          onClick={function displayDashboard() {
            solaceClient.publish(
              `${sessionId}/${pubsubplus_config.start_topic}`,
              JSON.stringify({ start: true })
            );
            setSessionState("STARTED"); // start the session, navigate to dashboard
          }}
        >
          { stationsLength } Stations Connected
        </Button>
      </Container>
    );
  }
}

export default QRCodeLandingPage;
