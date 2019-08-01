/**
 * mqtt-config.js
 * This file is used to connect MQTT clients in the application.
 * Fill these details out using the information provided by the "MQTT" section
 * in the "Connect" tab of your Solace Cloud Broker. 
 * 
 * Notes:
 * - mqtt_host:   use the root address of the Secured MQTT WebSocket host URI (no port, no protocol prefix)
 * - mqtt_port:   use the port listed at the end of the Secured MQTT WebSocket host URI
 * - login_topic: matter of personal preference.  
 *   This topic is where the dashboard should be listening for login messages.
 * - start_topic: matter of personal preference.
 *   This topic should correspond to the topic that the dashboard will send start messages.
 * @author Andrew Roberts
 */
export const mqtt_config = {
  username: "",
  password: "",
  mqtt_host: "",
  mqtt_port: 0,
  login_topic: "",
  start_topic: ""
};