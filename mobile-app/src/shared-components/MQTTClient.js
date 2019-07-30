import "./PahoMQTT";

var uid = "test123"; // for now
var connections = [];

function onConnect(obj) {
  var client = obj.invocationContext; 
  client.isConnected = true;
  console.log("Connected to Solace Cloud "+client.desc+"!");
}

function onFailure(obj) {
  var client = obj.invocationContext;
  console.log("Error connecting to "+client.desc+": code "+obj.errorCode+",\n"+obj.errorMessage);
  console.log(client._getURI());
  client.isConnected = false;
}

export function MQTTClient(desc, url, port, pw, sysCallBack) {
  var connection = {};
  var client = new Paho.MQTT.Client(url, port, "/", uid);
  client.desc = desc;
  client.pw = pw;
  client.isConnected = false;
  client.benchmarkMsgs = 0;
  client.benchmarkTotal = 0;
  var connectOptions = {};
  connectOptions["useSSL"] = true;
  connectOptions["userName"] = "solace-cloud-client";
  connectOptions["password"] = "4r43sbnrcsh8cj2r57oav619k7";
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
    console.log("Disconnected from " + client.desc);
  };

  connection.client = client;

  // connect the client
  console.log("Connecting to Solace Cloud "+client.desc);
  client.connect(client.connectOptions);

  return client;
}
