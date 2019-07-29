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

/**
 * Solace Web Messaging API for JavaScript
 * Publish/Subscribe tutorial - Topic Subscriber
 * Demonstrates subscribing to a topic for direct messages and receiving messages
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var SolaceClient = function (topicName,subscriberCallback) {
    'use strict';
    var solaceclient = {};
    solaceclient.session = null;
    solaceclient.topicName = topicName;
    solaceclient.subscribed = false;
    solaceclient.subscriberCallback = subscriberCallback;

    // Logger
    solaceclient.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
            ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
      
    };

    solaceclient.log('\n*** Subscriber to topic "' + solaceclient.topicName + '" is ready to connect ***');
   

    // Establishes connection to Solace router
    solaceclient.connect = function () {
        // extract params
        if (solaceclient.session !== null) {
            solaceclient.log('Already connected and ready to subscribe.');
            return;
        }
      
        solaceclient.log('Connecting to Solace message router using url: ' + pubsubplus_config.solace_ws_host);
        solaceclient.log('Client username: ' + pubsubplus_config.username);
        solaceclient.log('Solace message router VPN name: ' + pubsubplus_config.vpn);
        // create session
        try {
            solaceclient.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      pubsubplus_config.solace_ws_host,
                vpnName:  pubsubplus_config.vpn,
                userName: pubsubplus_config.username,
                password: pubsubplus_config.password
            });
            solaceclient.session.connect();
        } catch (error) {
            solaceclient.log(error.toString());
        }
        // define session event listeners
        solaceclient.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            solaceclient.log('=== Successfully connected and ready to subscribe. ===');
            solaceclient.subscribe();
        });
        solaceclient.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            solaceclient.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        solaceclient.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            solaceclient.log('Disconnected.');
            solaceclient.subscribed = false;
            if (solaceclient.session !== null) {
                solaceclient.session.dispose();
                solaceclient.session = null;
            }
        });
        solaceclient.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, function (sessionEvent) {
            solaceclient.log('Cannot subscribe to topic: ' + sessionEvent.correlationKey);
        });
        solaceclient.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, function (sessionEvent) {
            if (solaceclient.subscribed) {
                solaceclient.subscribed = false;
                solaceclient.log('Successfully unsubscribed from topic: ' + sessionEvent.correlationKey);
            } else {
                solaceclient.subscribed = true;
                solaceclient.log('Successfully subscribed to topic: ' + sessionEvent.correlationKey);
                solaceclient.log('=== Ready to receive messages. ===');
            }
        });
        // define message event listener
        solaceclient.session.on(solace.SessionEventCode.MESSAGE, function (message) {
            solaceclient.log('Received message: "' + message.getBinaryAttachment() + '", details:\n' +
                message.dump());
            solaceclient.subscriberCallback(message);
        });


       solaceclient.connectToSolace();   



    };

    // Actually connects the session triggered when the iframe has been loaded - see in html code
    solaceclient.connectToSolace = function () {
        try {
            solaceclient.connect();
        } catch (error) {
            solaceclient.log(error.toString());
        }
    };

    // Subscribes to topic on Solace message router
    solaceclient.subscribe = function () {
        if (solaceclient.session !== null) {
            if (solaceclient.subscribed) {
                solaceclient.log('Already subscribed to "' + solaceclient.topicName
                    + '" and ready to receive messages.');
            } else {
                solaceclient.log('Subscribing to topic: ' + solaceclient.topicName);
                try {
                    solaceclient.session.subscribe(
                        solace.SolclientFactory.createTopicDestination(solaceclient.topicName),
                        true, // generate confirmation when subscription is added successfully
                        solaceclient.topicName, // use topic name as correlation key
                        10000 // 10 seconds timeout for this operation
                    );
                } catch (error) {
                    solaceclient.log(error.toString());
                }
            }
        } else {
            solaceclient.log('Cannot subscribe because not connected to Solace message router.');
        }
    };

    // Unsubscribes from topic on Solace message router
    solaceclient.unsubscribe = function () {
        if (solaceclient.session !== null) {
            if (solaceclient.subscribed) {
                solaceclient.log('Unsubscribing from topic: ' + solaceclient.topicName);
                try {
                    solaceclient.session.unsubscribe(
                        solace.SolclientFactory.createTopicDestination(solaceclient.topicName),
                        true, // generate confirmation when subscription is removed successfully
                        solaceclient.topicName, // use topic name as correlation key
                        10000 // 10 seconds timeout for this operation
                    );
                } catch (error) {
                    solaceclient.log(error.toString());
                }
            } else {
                solaceclient.log('Cannot unsubscribe because not subscribed to the topic "'
                    + solaceclient.topicName + '"');
            }
        } else {
            solaceclient.log('Cannot unsubscribe because not connected to Solace message router.');
        }
    };

    solaceclient.publish = function (topic,payload) {
        if (solaceclient.session !== null) {
            var message = solace.SolclientFactory.createMessage();
            message.setDestination(solace.SolclientFactory.createTopicDestination(topic));
            message.setBinaryAttachment(payload);
            message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
            solaceclient.log('Publishing message "' + payload + '" to topic "' + topic + '"...');
            try {
                solaceclient.session.send(message);
                solaceclient.log('Message published.');
            } catch (error) {
                solaceclient.log(error.toString());
            }
        } else {
            solaceclient.log('Cannot publish because not connected to Solace message router.');
        }
    }

    // Gracefully disconnects from Solace message router
    solaceclient.disconnect = function () {
        solaceclient.log('Disconnecting from Solace message router...');
        if (solaceclient.session !== null) {
            try {
                solaceclient.session.disconnect();
            } catch (error) {
                solaceclient.log(error.toString());
            }
        } else {
            solaceclient.log('Not connected to Solace message router.');
        }
    };

    return solaceclient;
};