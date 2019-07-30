/**
 * 
*/
var broker, progressPumpMap, progressPumpMapIterator;

$(document).ready(function () {

    //progressPumpMap = new Map([["fillgauge1", null], ["fillgauge2", null], ["fillgauge3", null], ["fillgauge4", null], ["fillgauge5", null]]);
    progressPumpMap = new Map();
    initFillGauges();

    //alert handler
    function alertHandler(bResult, sMessage) {

        //create an empty div to be used for alerting
        //assign it our alert message
        var $div = $("<div></div>");
        $div.text(sMessage);

        //style the alert according to whether we
        //succeeded or failed.
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

    //call back function to handle intial connections
    function connectHandler(bResult, sMessage) {

        alertHandler(bResult, sMessage);
        if (bResult) {
            //we connected fine, now try and subscribe
            broker.subscribe(alertHandler);

            //broker.consume(alertHandler);
            //broker.onQueueMessage(messageHandler);
            broker.onTopicMessage(messageHandler);
        }

        return;
    }

    var broker = new PubSubPlusBroker();
    broker.connect(connectHandler);


})

function initFillGauges() {

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

    var fillgauge;

    for (var i = 0; i < 5; i++) {
        fillgauge = loadLiquidFillGauge("fillgauge" + (i + 1), 100, gaugeConfig);
        progressPumpMap.set(fillgauge, null);
    }

    /*var gauge1 = loadLiquidFillGauge("fillgauge1", 100, gaugeConfig);
    var gauge2 = loadLiquidFillGauge("fillgauge2", 100, gaugeConfig);
    var gauge3 = loadLiquidFillGauge("fillgauge3", 100, gaugeConfig);
    var gauge4 = loadLiquidFillGauge("fillgauge4", 100, gaugeConfig);
    var gauge5 = loadLiquidFillGauge("fillgauge5", 100, gaugeConfig);*/
}

function messageHandler(message) {

    console.info(message);

    var jsonMessage = JSON.parse(message);

    //determine the type of message (start or update)
    //call the appropriate function
    var msgtype = jsonMessage.type;

    if (msgtype.toLowerCase() == "start") {
        startGasPump(jsonMessage);
    } else {
        decrementPumpLevel(jsonMessage);
    }
}

/*
Called when a "START" message is received by 
PubSub+ on the appropriate topic. This function
assign a UUID to any available progress bar.
Once assigned, any events originating from a pump
with a given UUID are mapped to the appropriate progress bar.
*/
function startGasPump(message) {

    //iterate through our map till we find a progress bar without an associated "pump" (UUID)
    //and give it the UUID
    for (var [k, v] of progressPumpMap) {
        if (v == null) {
            progressPumpMap.set(k, message.UUID);
            break;
        }
    }
}

/*
 Decrements a pump's fuel level
*/
function decrementPumpLevel(message) {

    //get the pump associated with the given UUID
    //then get the current progress
    var uuid = message.UUID;
    var pump = '';


    for (var [k, v] of progressPumpMap) {
        if (uuid == v) {
            k.value = k.value + 1;

            break;
        }

    }
}