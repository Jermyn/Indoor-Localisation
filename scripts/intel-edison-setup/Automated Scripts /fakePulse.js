zmq = require('zmq');
// config = require('./configs/config.json');
Rx = require('rxjs/Rx')


///////////////////////////////////////////////////////////////////////////////////////////////
// STATE
/////////////////////////////////////////////////////////////////////////////////////////////// 
var healthyid = 'pox4'
var unhealthyid = 'pox5'
var anchor = 'rpi8'
var counter = 1

///////////////////////////////////////////////////////////////////////////////////////////////
// SOCKETS
/////////////////////////////////////////////////////////////////////////////////////////////// 
// anchorData = zmq.socket('push');
// anchorData.setsockopt(zmq.ZMQ_SNDHWM, 2000);
// anchorData.connect(config.zmqSockets.anchorData.pushpull);

///////////////////////////////////////////////////////////////////////////////////////////////
// OBSERVABLES
/////////////////////////////////////////////////////////////////////////////////////////////// 
healthyPatient$ = Rx.Observable.timer(60000)
unhealthyPatient$ = Rx.Observable.timer(60000, 120000)

///////////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////// 
between = function(min, max) {  
  return Math.floor(
    Math.random() * (max - min + 1) + min
  )
}

goodPatientPulse = function() {
	spo2 = between(95,99)
	bpm = between(70,120)
	return [bpm, spO2]
}

badPatientPulse = function(toggle) {
	spO2 = between(85,94)
	if (toggle == true)
		bpm = between(60,69)
	else
		bpm = between(121,130)
	return [bpm, spO2]
}

worsePatientPulse = function(toggle) {
	spO2 = between(75,84)
	if (toggle == true)
		bpm = between(50,59)
	else
		bpm = between(131,140)
	return [bpm, spO2]
}

healthyPatient$.subscribe(function() {
	[bpm, spO2] = goodPatientPulse()
	console.log('data from ' + poxid + '. spO2: ' + spO2 + ', bpm: ' + bpm + ', anchorid: ' + anchor);
    // send data via zmq                
    data = {
      gattid:         poxid, //uuid: peripheral.uuid,
      // service:        '6e400001b5a3f393e0a9e50e24dcca9e',
      // characteristic: '6e400003b5a3f393e0a9e50e24dcca9e',
      heart_rate:     bpm, 
      spo2:           spO2,
      anchorId:       anchor
    };
    return console.log ("Sending..." + ', bpm: ' + bpm + ', spO2: ' + spO2)
    // return anchorData.send(JSON.stringify(data));
})

unhealthyPatient$.subscribe(function() {
	if (counter == 1) {
		[bpm, spO2] = goodPatientPulse()
	}
	else if (counter == 2) {
		[bpm, spO2] = badPatientPulse()
	}
	else {
		[bpm, spO2] = worsePatientPulse()
		counter = 1
	}
	console.log('data from ' + poxid + '. spO2: ' + spO2 + ', bpm: ' + bpm + ', anchorid: ' + anchor);
    // send data via zmq                
    data = {
      gattid:         poxid, //uuid: peripheral.uuid,
      // service:        '6e400001b5a3f393e0a9e50e24dcca9e',
      // characteristic: '6e400003b5a3f393e0a9e50e24dcca9e',
      heart_rate:     bpm, 
      spo2:           spO2,
      anchorId:       anchor
    };
    // return anchorData.send(JSON.stringify(data));
    return console.log ("Sending..." + ', bpm: ' + bpm + ', spO2: ' + spO2)
})
