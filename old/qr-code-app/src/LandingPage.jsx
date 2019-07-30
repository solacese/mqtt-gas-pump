import React, { useState, useEffect } from "react";
import styled from "styled-components";
import solace from "solclientjs";
import { SolaceClient } from "./solace/solace-client";
import { pubsubplus_config } from "./solace/pubsubplus-config";

/**
 * Styling
 */
const Container = styled.div`
  align-items: center;
  background: #000000;
  color: #00cb95;
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;
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

function QRImage({session}) {
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?data=${session}&amp;size=200x200&amp;color=00CB95&amp;bgcolor=333333>`}
    />
  );
}

function LandingPage() {
  const [sessionId, setSessionId] = useState(null);
  const [loginUrl, setLoginUrl] = useState(null);
  const [solaceClient, setSolaceClient] = useState(null);
  const [stations, setStations] = useState([]);
  const [btnDashboardDisabled, setButtonDashboardDisabled] = useState(true);

  useEffect(() => {
    let sessionId = ((Math.random() * 0xffffff) << 0).toString(16);
    let sessionUrl = `http://localhost:1234/login?sessionId=${sessionId}`;
    // Initialize factory with the most recent API defaults
    var factoryProps = new solace.SolclientFactoryProperties();
    factoryProps.profile = solace.SolclientFactoryProfiles.version10;
    solace.SolclientFactory.init(factoryProps);
    // enable logging to JavaScript console at WARN level
    // NOTICE: works only with "solclientjs-debug.js"
    solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);
    let solaceClient = new SolaceClient(
      `${sessionId}/${pubsubplus_config.login_topic}`,
      function loginPump(message) {
        let loginMessage = JSON.parse(message.getBinaryAttachment());
        setStations(prevStations => [...prevStations, loginMessage.name]);
        setButtonDashboardDisabled(false);
      }
    );
    solaceClient.connectToSolace();
    setSessionId(sessionId);
    setLoginUrl(sessionUrl);
    setSolaceClient(solaceClient);
  }, []);

  return (
    <Container>
      <Title>Solace MQTT Gas Pump Demo</Title>
      <QRImage session={loginUrl} />
      <p>Scan QR Code with your mobile phone to turn it into a gas station!</p>
      {console.log(loginUrl)}
      <Button
        disabled={btnDashboardDisabled}
        onClick={function displayDashboard() {
          solaceClient.publish(
            `${sessionId}/${pubsubplus_config.start_topic}`,
            JSON.stringify({start: true})
          );
          // SET STATE TO TRANSITION HERE
          }
        }
      >
        {stations.length} Stations Connected
      </Button>
    </Container>
  );
}

export default LandingPage;
