	net = require('net');
zmq = require('zeromq');
// config = require('./aws_config.json');
Rx = require('rxjs/Rx')

///////////////////////////////////////////////////////////////////////////////////////////////
// STATE
/////////////////////////////////////////////////////////////////////////////////////////////// 
var healthyid = 'pox4'
var unhealthyid = 'pox5'
var anchor = 'rpi8'
var counter = 1
// var logHost = '54.179.193.123'
var logHost = '127.0.0.1'
  , logPort = 5556
  , sender = require('os').hostname();

///////////////////////////////////////////////////////////////////////////////////////////////
// SOCKETS
/////////////////////////////////////////////////////////////////////////////////////////////// 
// anchorData = new net.Socket();
// anchorData = net.connect(5556, '54.179.193.123', function() {
// 	console.log('Connected');
// 	console.log (anchorData.write('Hello, server! Love, Client.'))
// 	// anchorData.destroy()
// });

///////////////////////////////////////////////////////////////////////////////////////////////
// OBSERVABLES
/////////////////////////////////////////////////////////////////////////////////////////////// 
healthyPatient$ = Rx.Observable.timer(1000, 10000)
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
	spO2 = between(95,99)
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
	anchorData = net.connect(5556, '127.0.0.1', function() {
		console.log('Connected');
	});
	// console.log (anchorData.write('Hello, server! Love, Client.')
	[bpm, spO2] = goodPatientPulse()
	console.log('data from ' + healthyid + '. spO2: ' + spO2 + ', bpm: ' + bpm + ', anchorid: ' + anchor);
    // send data via zmq                
    data = {
      gattid:         healthyid, //uuid: peripheral.uuid,
      // service:        '6e400001b5a3f393e0a9e50e24dcca9e',
      // characteristic: '6e400003b5a3f393e0a9e50e24dcca9e',
      heart_rate:     bpm, 
      spo2:           spO2,
      anchorId:       anchor
    };
    console.log ("Sending..." + ', bpm: ' + bpm + ', spO2: ' + spO2)
    // console.log (typeof(data), typeof(JSON.stringify(data)))
    // return console.log (JSON.stringify(data))
    return anchorData.write(JSON.stringify((data)), () => {
    	console.log ("Send successfully")
    	anchorData.destroy()
    });
})

// client.on('data', function(data) {
// 	console.log('Received: ' + data);
// 	client.destroy(); // kill client after server's response
// });

// client.on('close', function() {
// 	console.log('Connection closed');
// });