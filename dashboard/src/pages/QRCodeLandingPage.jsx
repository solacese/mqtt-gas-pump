/**
 * QRCodeLandingPage.jsx
 * Displays a QR code that users can scan to connect to the demo.
 * The page shows a count of how many stations are connected, which more specifically
 * means they've scanned the QR code and have chosen and submitted a name for their 
 * station using the mobile app.
 * 
 * === Note === 
 * This is the page that generates a random session ID that will be used to connect the dashboard
 * to its associated mobile applications.  
 * @author Andrew Roberts
 */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Redirect } from "react-router-dom";
import { SolaceClient } from "../shared-components/solace/solace-client";
import { pubsubplus_config } from "../shared-components/solace/pubsubplus-config";

/**
 * Styling
 */

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

const Title = styled.h1`
  display: flex;
  justify-content: center;
`;

/**
 * Components
 */

function QRImage({ url }) {
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?data=${url}&amp;size=200x200&amp;color=00CB95&amp;bgcolor=333333>`}
    />
  );
}

function QRCodeLandingPage() {
  // transition state
  const [transition, setTransition] = useState("WAITING");
  // session state
  const [session, setSession] = useState({
    mobileUrl: null,
    sessionId: null,
    solaceConnectionDetails: pubsubplus_config,
    solaceClient: null,
    stations: {},
    stationsLength: 0
  });

  // set up session
  useEffect(() => {
    const sessionId = ((Math.random() * 0xffffff) << 0).toString(16);
    const mobileUrl = `http://mqtt-gas-pump-demo-mobile.s3-website-us-east-1.amazonaws.com/login?sessionId=${sessionId}`;
    const solaceClient = SolaceClient(
      session.solaceConnectionDetails,
      `${sessionId}/${session.solaceConnectionDetails.login_topic}`,
      function loginPump(message) {
        // this callback function gets triggered when the client receives a message 
        // from the mobile applications.  Currently, it expects a message in the following format:
        // { name: stationName, id: stationId }
        let loginMessage = JSON.parse(message);
        // update state to include whoever logs in to the session
        setSession(function setSessionCallback(prevSession){
          // this syntax is pretty handy in react
          // it means to preserve everything in the previous state
          // except what is explicitly specified, in this case stations and stationsLength
          return {
            ...prevSession,
            stations: {
              ...prevSession.stations,
              [loginMessage.id]: {
                ...prevSession.stations[loginMessage.id],
                name: loginMessage.name,
                id: loginMessage.id
              }
            },
            stationsLength: prevSession.stationsLength + 1
          };
        })
      }
    );
    solaceClient.connectToSolace();

    setSession({
      ...session,
      sessionId: sessionId,
      mobileUrl: mobileUrl,
      solaceClient: solaceClient
    });
  }, []);

  // if the session has been started, navigate to the dashboard
  if (transition == "STARTED") {
    return (
      <Redirect
        to={{
          pathname: "/dashboard",
          state: {
            connectionDetails: session.solaceConnectionDetails,
            sessionId: session.sessionId,
            stations: session.stations
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
        <QRImage url={session.mobileUrl} />
        <p>
          Scan QR Code with your mobile phone to turn it into a gas station!
        </p>
        <Button
          disabled={session.stationsLength > 0 ? false : true}
          onClick={function displayDashboard() {
            session.solaceClient.publish(
              `${session.sessionId}/${session.solaceConnectionDetails.start_topic}`,
              JSON.stringify({ start: true })
            );
            setTransition("STARTED"); // start the session, navigate to dashboard
          }}
        >
          { session.stationsLength } Stations Connected
        </Button>
      </Container>
    );
  }
}

export default QRCodeLandingPage;
