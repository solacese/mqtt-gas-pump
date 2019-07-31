import "./PahoMQTT";
import { mqtt_config } from "./mqtt-config";

var sessionId;
var stationId;

function onConnect(obj) {
  var client = obj.invocationContext; 
  client.isConnected = true;
  console.log("Connected to Solace Cloud!");
  console.log(`Subscribing to ${sessionId}/${stationId}/SYS`);
  client.subscribe(`${sessionId}/${stationId}/SYS`); // listen for STOP signals
}

function onFailure(obj) {
  var client = obj.invocationContext;
  console.log(`Error connecting: code ${obj.errorCode}\n${obj.errorMessage}`);
  console.log(client._getURI());
  client.isConnected = false;
}

export function MQTTClient(url, port, sessionObj, sysCallBack) {
  // set up session variables for subscribing to sys level msgs
  sessionId = sessionObj["sessionId"];
  stationId = sessionObj["stationId"];
  
  // client config
  var connection = {};
  var client = new Paho.MQTT.Client(url, port, "/", stationId);
  client.username = mqtt_config.username;
  client.pw = mqtt_config.password;
  client.isConnected = false;
  client.benchmarkMsgs = 0;
  client.benchmarkTotal = 0;
  var connectOptions = {};
  connectOptions["useSSL"] = true;
  connectOptions["userName"] = mqtt_config.username;
  connectOptions["password"] = mqtt_config.password;
  connectOptions["invocationContext"] = client;
  connectOptions["onSuccess"] = onConnect;
  connectOptions["onFailure"] = onFailure;
  client.connectOptions = connectOptions;

  client.onMessageArrived = function(message) {
    console.log("RECEIVED MESSAGE: ", message._getPayloadString());
    sysCallBack();
  };

  client.onConnectionLost = function(responseObject) {
    // called when the client loses its connection
    client.isConnected = false;
    console.log("Disconnected.");
  };

  connection.client = client;

  // connect the client
  console.log("Connecting to Solace Cloud..");
  client.connect(client.connectOptions);

  return client;
}
