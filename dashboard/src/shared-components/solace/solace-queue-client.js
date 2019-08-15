/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import solace from "solclientjs";
/**
 * Solace Web Messaging API for JavaScript
 * Persistence with Queues tutorial - Queue Consumer
 * Demonstrates receiving persistent messages from a queue
 */

// Initialize factory with the most recent API defaults
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);
// enable logging to JavaScript console at WARN level
// NOTICE: works only with "solclientjs-debug.js"
solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

export const SolaceQueueClient = function (connectOptions,queueName,subscriberCallback) {
    'use strict';
    var solacequeueclient = {};
    solacequeueclient.session = null;
    solacequeueclient.flow = null;
    solacequeueclient.queueName = queueName;
    solacequeueclient.queueDestination = new solace.Destination(solacequeueclient.queueName, solace.DestinationType.QUEUE);
    solacequeueclient.consuming = false;
    solacequeueclient.subscriberCallback = subscriberCallback;
    // Logger
    solacequeueclient.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
            ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
    };

    solacequeueclient.log('\n*** solacequeueclient to queue "' + solacequeueclient.queueName + '" is ready to connect ***');

    // Establishes connection to Solace message router
    solacequeueclient.connect = function () {
        if (solacequeueclient.session !== null) {
            solacequeueclient.log('Already connected and ready to consume messages.');
            return;
        }
       
        solacequeueclient.log('Connecting to Solace message router using url: ' + connectOptions.solace_ws_host);
        solacequeueclient.log('Client username: ' + connectOptions.username);
        solacequeueclient.log('Solace message router VPN name: ' + connectOptions.vpn);
        
        // create session
        try {
            solacequeueclient.session = solace.SolclientFactory.createSession({
                   // solace.SessionProperties
                   url:      connectOptions.solace_ws_host,
                   vpnName:  connectOptions.vpn,
                   userName: connectOptions.username,
                   password: connectOptions.password
            });
            solacequeueclient.session.connect();
        } catch (error) {
            solacequeueclient.log(error.toString());
        }
        // define session event listeners
        solacequeueclient.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            solacequeueclient.log('=== Successfully connected and ready to start the message solacequeueclient. ===');
            solacequeueclient.startConsume();
        });
        solacequeueclient.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            solacequeueclient.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        solacequeueclient.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            solacequeueclient.log('Disconnected.');
            solacequeueclient.consuming = false;
            if (solacequeueclient.session !== null) {
                solacequeueclient.session.dispose();
                solacequeueclient.session = null;
            }
        });

        solacequeueclient.connectToSolace();   

    };

    // Actually connects the session triggered when the iframe has been loaded - see in html code
    solacequeueclient.connectToSolace = function () {
        try {
            solacequeueclient.connect();
        } catch (error) {
            solacequeueclient.log(error.toString());
        }
    };

    // Starts consuming from a queue on Solace message router
    solacequeueclient.startConsume = function () {
        if (solacequeueclient.session !== null) {
            if (solacequeueclient.consuming) {
                solacequeueclient.log('Already started solacequeueclient for queue "' + solacequeueclient.queueName + '" and ready to receive messages.');
            } else {
                solacequeueclient.log('Starting solacequeueclient for queue: ' + solacequeueclient.queueName);
                try {
                    // Create a message solacequeueclient
                    solacequeueclient.messageConsumer = solacequeueclient.session.createMessageConsumer({
                        // solace.MessagesolacequeueclientProperties
                        queueDescriptor: { name: solacequeueclient.queueName, type: solace.QueueType.QUEUE },
                        acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT, // Enabling Client ack
                    });
                    // Define message solacequeueclient event listeners
                    solacequeueclient.messageConsumer.on(solace.MessageConsumerEventName.UP, function () {
                        solacequeueclient.consuming = true;
                        solacequeueclient.log('=== Ready to receive messages. ===');
                    });
                    solacequeueclient.messageConsumer.on(solace.MessageConsumerEventName.CONNECT_FAILED_ERROR, function () {
                        solacequeueclient.consuming = false;
                        solacequeueclient.log('=== Error: the message solacequeueclient could not bind to queue "' + solacequeueclient.queueName +
                            '" ===\n   Ensure this queue exists on the message router vpn');
                    });
                    solacequeueclient.messageConsumer.on(solace.MessageConsumerEventName.DOWN, function () {
                        solacequeueclient.consuming = false;
                        solacequeueclient.log('=== The message solacequeueclient is now down ===');
                    });
                    solacequeueclient.messageConsumer.on(solace.MessageConsumerEventName.DOWN_ERROR, function () {
                        solacequeueclient.consuming = false;
                        solacequeueclient.log('=== An error happened, the message solacequeueclient is down ===');
                    });
                    // Define message received event listener
                    solacequeueclient.messageConsumer.on(solace.MessageConsumerEventName.MESSAGE, function (message) {
                        solacequeueclient.subscriberCallback(message.getBinaryAttachment());
                        message.acknowledge();
                    });
                    // Connect the message solacequeueclient
                    solacequeueclient.messageConsumer.connect();
                } catch (error) {
                    solacequeueclient.log(error.toString());
                }
            }
        } else {
            solacequeueclient.log('Cannot start the queue solacequeueclient because not connected to Solace message router.');
        }
    };

    // Disconnects the solacequeueclient from queue on Solace message router
    solacequeueclient.stopConsume = function () {
        if (solacequeueclient.session !== null) {
            if (solacequeueclient.consuming) {
                solacequeueclient.consuming = false;
                solacequeueclient.log('Disconnecting consumption from queue: ' + solacequeueclient.queueName);
                try {
                    solacequeueclient.messageConsumer.disconnect();
                    solacequeueclient.messageConsumer.dispose();
                } catch (error) {
                    solacequeueclient.log(error.toString());
                }
            } else {
                solacequeueclient.log('Cannot disconnect the solacequeueclient because it is not connected to queue "' +
                    solacequeueclient.queueName + '"');
            }
        } else {
            solacequeueclient.log('Cannot disconnect the solacequeueclient because not connected to Solace message router.');
        }
    };

    solacequeueclient.publish = function (topic,payload) {
        if (solacequeueclient.session !== null) {
            var message = solace.SolclientFactory.createMessage();
            message.setDestination(solace.SolclientFactory.createTopicDestination(topic));
            message.setBinaryAttachment(payload);
            message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
            solacequeueclient.log('Publishing message "' + payload + '" to topic "' + topic + '"...');
            try {
                solacequeueclient.session.send(message);
                solacequeueclient.log('Message published.');
            } catch (error) {
                solacequeueclient.log(error.toString());
            }
        } else {
            solacequeueclient.log('Cannot publish because not connected to Solace message router.');
        }
    }



    // Gracefully disconnects from Solace message router
    solacequeueclient.disconnect = function () {
        solacequeueclient.log('Disconnecting from Solace message router...');
        if (solacequeueclient.session !== null) {
            try {
                solacequeueclient.session.disconnect();
            } catch (error) {
                solacequeueclient.log(error.toString());
            }
        } else {
            solacequeueclient.log('Not connected to Solace message router.');
        }
    };

    return solacequeueclient;
};
