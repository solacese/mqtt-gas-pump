/**
 * 
*/
var broker, fillMeterMap;

$(document).ready(function () {

    /*a map of the meters on screen that represent & track the pump level
     *Each map entry is of the form (pump-meter, UUID) where pump-meter
     *represents an on-screen gauge, and UUID is the unique identifier of
     *the pump th pump-meter is tracking
     */
    fillMeterMap = new Map();


    /** 
     *Used for handling & constructing alert messages on screen.
     *
     * @param {boolean} bResult - The result of the action that is being alerted on
     * @param {string} sMessage - the alert message
    */
    function alertHandler(bResult, sMessage) {

        //create an empty div to be used as a placeholder for our alert & assign
        //our alert text
        var $div = $("<div></div>");
        $div.text(sMessage);

        //style the alert according to whether we
        //succeeded or failed. NOTE: These are Bootstrap-specific styles
        if (bResult) {
            $div.addClass("alert alert-success");
        } else {
            $div.addClass("alert alert-danger");
        }

        //add in our alert and have it fade out
        //in 5s.
        $("#alerts").append($div);
        $div.fadeOut(5000);

        return;
    }

    /**
     * Performs further actions based on whether or not we are able to connect 
     * to a given broker. The broker-specifics are set in an external JSON object
     * read by pubsubplusbroker.js.
     * 
     * @param {boolean} bResult - result of the connection attempt to the broker
     * @param {string} sMessage - message associated with the connection attempt
     */
    function brokerConnectHandler(bResult, sMessage) {

        //generate an alert for our connection attempt
        alertHandler(bResult, sMessage);

        if (bResult) {
            //we connected fine, now try and subscribe
            broker.subscribe(alertHandler);

            //since the connection was OK, assign a listener for topic messages
            broker.onTopicMessage(messageHandler);
        }

        return;
    }

    //fire up a new broker connection
    var broker = new PubSubPlusBroker();
    broker.connect(brokerConnectHandler);

    //Initialize our on-screen pump meters
    initFillGauges();
})

/**
 * Initializes the on-screen pump meters (gauges) that will track how much
 * gas has been consumed / "pumped".
 */
function initFillGauges() {

    //setup gauge defaults. These are used by all meters
    var gaugeConfig = liquidFillGaugeDefaultSettings();

    gaugeConfig.circleColor = "#D4AB6A";
    gaugeConfig.circleThickness = 0.1;
    gaugeConfig.circleFillGap = 0.2;
    gaugeConfig.textColor = "#553300";
    gaugeConfig.waveTextColor = "#FFFFFF";
    gaugeConfig.textVertPosition = 0.5;
    gaugeConfig.displayPercent = false;
    gaugeConfig.textSize = 1.2;
    gaugeConfig.waveColor = "#AA7D39";
    gaugeConfig.waveAnimateTime = 2000;
    gaugeConfig.waveHeight = 0.3;
    gaugeConfig.waveCount = 1;

    //temp variable to hold the "current" meter being configured
    var fillgauge;

    //iterate over all meters onscreen and initialize them
    for (var i = 1; i < 6; i++) {
        fillgauge = loadLiquidFillGauge("fillgauge" + i, 100, gaugeConfig);

        /*insert the initialized fill meter into our map.
         *for the moment, the UUID in the map is null since no pump has been assigned 
         *to the gauge.
        */
        fillMeterMap.set(fillgauge, null);
    }
}

/**
 * Interprets and handles the JSON string published by each pump connected to the 
 * dashboard.
 * 
 * @param {String} message - The message published by a given pump. Has to be a valid JSON string of the form
 * 
 *   {
 *   "UUID": <a valid UUID>,
 *   "type": <"start" | "update">,
 *   "location" : <a string representing the geographic location of the pump e.g. "Toronto">
 *   "value" : <a number indicating the current level of the pump>
 *   }
 */
function messageHandler(message) {

    //convert the incoming string to JSON
    var jsonMessage = JSON.parse(message);

    //determine what to do based on the message type we just received
    switch (jsonMessage.type.toUpperCase()) {
        case ("START"):
            startPump(jsonMessage);
            break;
        case ("UPDATE"):
            updatePumpLevel(jsonMessage);
            break;
        default:
            console.warn("Unknown message type: '" + jsonMessage.type + "'");
    }
}

/**
 * Assigns a UUID & location to a given gauge. 
 * Thereafter, any events originating from a pump with a given UUID are reflected against
 * the appropriate meter.
 *  
 * @param {Object} jsonMessage - Incoming JSON from the pump as parsed by messageHandler(...)
 * 
 */
function startPump(jsonMessage) {

    var i = 0;

    //iterate through our map till we find a progress bar without an associated "pump" (UUID)
    //and give it the UUID
    for (var [k, v] of fillMeterMap) {
        i=i+1;

        if (v == null) {
            fillMeterMap.set(k, jsonMessage.UUID);
            $('#pumpHeader' + i).text(jsonMessage.location);
            break;
        }
    }
}

/**
 * Updates the gauge identified by 'UUID', with the given value.
 * 
 * @param {Object} jsonMessage - Incoming JSON from the pump as parsed by messageHandler(...) 
 */
function updatePumpLevel(jsonMessage) {

    //get the uuid in question
    var uuid = jsonMessage.UUID;
    var value = jsonMessage.value;

    //find the meter associated with this UUID & update it
    for (var [k, v] of fillMeterMap) {
        if (uuid == v && value>=0) {
            k.update(jsonMessage.value);
            break;
        }

    }
}