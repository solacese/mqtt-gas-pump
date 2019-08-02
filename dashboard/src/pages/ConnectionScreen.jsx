/**
 * ConnectionScreen.jsx
 * Set up connection details that the dashboard will use to connect to a Solace Broker.
 * It prepopulates with the details provided in src/shared-components/solace/pubsubplus-config.js
 * 
 * == Note == 
 * Changing the prepopulated details is not recommended, since the mobile app is going to connect using 
 * whatever details are provided by its config file.  This screen is mainly for show, so that the audience
 * realizes that we're connecting to a broker using the details provided by the "Connect" tab 
 * in the Solace Cloud GUI.
 * @author Andrew Roberts
 */

import React, { useState } from "react";
import styled from "styled-components";
import { Redirect } from "react-router-dom";
import { pubsubplus_config } from "../shared-components/solace/pubsubplus-config";
import { useInput } from "../shared-components/hooks";
import { Flex } from "../shared-components/layout";

/**
 * Styling
 */
const Container = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const ConnectionForm = styled.div`
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  height: auto;
  margin-top: 25px;
  padding: 25px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;

const FormInput = styled.input`
  flex-grow: 1;
  font-size: 1em;
`;

const FormLabel = styled.label`
  font-size: 1em;
  font-weight: bold;
  margin-bottom: 5px;
`;

const FormTitle = styled.div`
  font-size: 1.15em;
  font-weight: bold;
  margin-bottom: 25px;
`;

const StartButton = styled.button`
  background-color: #4caf50;
  border: none;
  border-radius: 5px;
  color: white;
  display: inline-block;
  font-size: 1.1em;
  margin-top: 25px;
  padding: 10px;
  text-align: center;
  width: 100%;

  &:hover {
    filter: brightness(110%);
  }
`;

/**
 * Components
 */

function ConnectionScreen() {
  // transition state
  const [transitionState, setTransitionState] = useState("WAITING");

  // input state
  const { value: username, bind: bindUsername } = useInput(
    pubsubplus_config.username
  );
  const { value: password, bind: bindPassword } = useInput(
    pubsubplus_config.password
  );
  const { value: wsHost, bind: bindWsHost } = useInput(
    pubsubplus_config.solace_ws_host
  );
  const { value: vpn, bind: bindVpn } = useInput(pubsubplus_config.vpn);

  // when the user clicks the connect button, navigate to the qr-code page
  if (transitionState == "NAVIGATE") {
    return (
      <Redirect
        to={{
          pathname: "/qr-code",
          state: {
            connectionDetails: {
              username: username,
              password: password,
              solace_ws_host: wsHost,
              vpn: vpn
            }
          }
        }}
      />
    );
  }
  else {
    return (
      <Container>
        <ConnectionForm>
          <FormTitle>
            Enter the connection details of your Solace PubSub+ Broker
          </FormTitle>
          <form>
            <FormGroup>
              <FormLabel>Username:</FormLabel>
              <FormInput type="text" {...bindUsername} />
            </FormGroup>
            <FormGroup>
              <FormLabel>Password:</FormLabel>
              <FormInput type="text" {...bindPassword} />
            </FormGroup>
            <FormGroup>
              <FormLabel>Solace Host Websocket URL:</FormLabel>
              <FormInput type="text" {...bindWsHost} />
            </FormGroup>
            <FormGroup>
              <FormLabel>Message VPN:</FormLabel>
              <FormInput type="text" {...bindVpn} />
            </FormGroup>
            <Flex width={"100%"} justifyCenter>
              <StartButton
                type={""}
                onClick={function start() {
                  if (username && password && wsHost && vpn) {
                    setTransitionState("NAVIGATE");
                  } else {
                    alert("Please fill out all values before starting!");
                  }
                }}
              >
                START!
              </StartButton>
            </Flex>
          </form>
        </ConnectionForm>
      </Container>
    );
  }
}

export default ConnectionScreen;
