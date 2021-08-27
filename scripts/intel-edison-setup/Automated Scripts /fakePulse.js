zmq = require('zeromq');
config = require('./aws_config.json');
Rx = require('rxjs/Rx')
// log = require('./log.js')
exec = require('child_process').exec;
///////////////////////////////////////////////////////////////////////////////////////////////
// STATE
/////////////////////////////////////////////////////////////////////////////////////////////// 
var healthyid = 'c1247ac867ef'
// var unhealthyid = 'pox5'
var anchor = 'b827eb527b42'
var counter = 1
var env = {}
var syslog = {}
var time = new Date();
// var checkpointsLen = 10;
// console.log("Experiment Start:", time.getTime(), time.toLocaleTimeString());
///////////////////////////////////////////////////////////////////////////////////////////////
// SOCKETS
/////////////////////////////////////////////////////////////////////////////////////////////// 
// anchorData = zmq.socket('push');
// anchorData.setsockopt(zmq.ZMQ_SNDHWM, 2000);
// anchorData.connect(config.zmqSockets.beaconData.pushpull);
vitals = zmq.socket('push');
vitals.setsockopt(zmq.ZMQ_SNDHWM, 2000);
vitals.connect(config.zmqSockets.vitals.pushpull);
// anchorData.connect("tcp://127.0.0.1:5556");
// notify = zmq.socket('pub');
// notify.connect(config.zmqSockets.broker.xsub);
// rawData = zmq.socket('push');
// rawData.setsockopt(zmq.ZMQ_SNDHWM, 2000);
// rawData.connect(config.zmqSockets.rawData.pushpull);
///////////////////////////////////////////////////////////////////////////////////////////////
// OBSERVABLES
/////////////////////////////////////////////////////////////////////////////////////////////// 
healthyPatient$ = Rx.Observable.timer(5000, 10000)
// _rawData$ = Rx.Observable.timer(1000, 1000)
// exitProg$ = Rx.Observable.timer(200000)
// unhealthyPatient$ = Rx.Observable.timer(60000, 120000)
// positionUpdate$ = Rx.Observable.timer(4000,50000)
// updateSyslog$  = Rx.Observable.timer(1000, 60000);
// anchorRequest$ = Rx.Observable.timer(2000);
// _anchorStatus$ = new Rx.Subject();
// anchorStatus$  = Rx.Observable.merge(_anchorStatus$, Rx.Observable.timer(3000, 900000));

///////////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////// 
execAsync = function(command) {
  return new Promise(function(resolve, reject) {
    return exec(command, function(err, stdout, stderr) {
      if (err) {
        return resolve(null);
      } else {
        return resolve(stdout);
      }
    });
  });
};

updateSyslog = function() {
  return log.getCurrentState().then(function(res) {    
    return syslog = res;
  }).catch(function(err) {
    console.log('error: cannot update syslog');
    return syslog = {};
  });
};

between = function(min, max) {  
  return Math.floor(
    Math.random() * (max - min + 1) + min
  )
}

goodPatientPulse = function() {
	spO2 = between(95,99)
	bpm = between(80,140)
	return [bpm, spO2]
}

badPatientPulse = function(toggle) {
	// spO2 = between(85,94)
	if (toggle == true)
		bpm = between(60,69)
	else
		bpm = between(121,130)
	return bpm
}

worsePatientPulse = function(toggle) {
	// spO2 = between(75,84)
	if (toggle == true)
		bpm = between(50,59)
	else
		bpm = between(131,140)
	return bpm
}

connectedPeripherals = function() {
  return _.values(noble._peripherals).filter(function({state}) {
    return state === 'connected';
  });
};

anchorStatus = function() {
  var data;
  data = {
    syslog,
    anchorId: env.anchor,
    gatts: {
      connected: []
      // connectedPeripherals().map(function({uuid}) {
      //   return uuid;
      // })
    },
  };
  //notify.connect(config.zmqSockets.broker.xsub); // re-connect socket
  // console.log (data)
  return notify.send([config.notifications.anchorStatus, JSON.stringify(data)]);
};

positionUpdate = function() {
	var data;
	data = {
		_map : {
		    "id": "Jermyn_Home",
		    "scale": 1,
		    "coordinates": [0,0]
  		},
		lng : 0.0181176829048734,
		lat : 0.00823198367374096
	}
	return notify.send([config.notifications.positionUpdate, JSON.stringify(data)]);
}

exitProgram = function() {
  var time = new Date();
  console.log("Raw RSSI Simulation has ended...");
  console.log("Experiment End:", time.getTime(), time.toLocaleTimeString())
  process.exit();
}

rawDataSend = function() {
  var data;
  var rssi = between(-40, -90)
  var time = (new Date()).getTime();
  data = {
    time: time,
    gattid: healthyid,
    anchorId: anchor,
    rssi: rssi,
    tags: 'rawRSSI',
  };
  console.log(data)
  return rawData.send(JSON.stringify(data))
}

// updateSyslog$.subscribe(function() {
//   return updateSyslog();
// });

// anchorStatus$.subscribe(function() {
//   console.log('sending anchor status...')
//   return anchorStatus();
// });

// positionUpdate$.subscribe(function() {
// 	console.log('Sending position data...')
// 	return positionUpdate();
// })

// _rawData$.subscribe(function() {
//   console.log('Sending raw rssi packets...')
//   return rawDataSend();
// })

// exitProg$.subscribe(function() {
//   return exitProgram();
// })

// anchorRequest$.subscribe(function() {  
//   let anchor = syslog.address.replace(/:/g,'').replace(/\n/g, '');  
//   env.anchor = anchor; // anchor mac address  
// });

healthyPatient$.subscribe(function() {
	[bpm, spo2] = goodPatientPulse()
	console.log('data from ' + healthyid + ', bpm: ' + bpm + ', anchorid: ' + anchor);
    // send data via zmq                
    data = {
      gattid:         healthyid, //uuid: peripheral.uuid,
      // service:        '6e400001b5a3f393e0a9e50e24dcca9e',
      // characteristic: '6e400003b5a3f393e0a9e50e24dcca9e',
      heart_rate:     bpm, 
      spo2:           spO2,
      anchorId:       anchor,
      type: "VITALS",
      tags : "instantaneous"
    };
    console.log ("Sending..." + ', bpm: ' + bpm + ', spo2: ' + spo2)
    // console.log (data)
    // console.log (typeof(data), typeof(JSON.stringify(data)))
    return vitals.send(JSON.stringify(data))
    // return anchorData.send(data);
})

// unhealthyPatient$.subscribe(function() {
// 	if (counter == 1) {
// 		[bpm, spO2] = goodPatientPulse()
// 	}
// 	else if (counter == 2) {
// 		[bpm, spO2] = badPatientPulse()
// 	}
// 	else {
// 		[bpm, spO2] = worsePatientPulse()
// 		counter = 1
// 	}
// 	console.log('data from ' + poxid + '. spO2: ' + spO2 + ', bpm: ' + bpm + ', anchorid: ' + anchor);
//     // send data via zmq                
//     data = {
//       gattid:         poxid, //uuid: peripheral.uuid,
//       // service:        '6e400001b5a3f393e0a9e50e24dcca9e',
//       // characteristic: '6e400003b5a3f393e0a9e50e24dcca9e',
//       heart_rate:     bpm, 
//       spo2:           spO2,
//       anchorId:       anchor
//     };
//     // return anchorData.send(JSON.stringify(data));
//     return console.log ("Sending..." + ', bpm: ' + bpm + ', spO2: ' + spO2)
// })
