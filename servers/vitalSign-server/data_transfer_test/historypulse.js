zmq = require('zeromq');
config = require('../../../scripts/intel-edison-setup/Automated\ Scripts\ /aws_config.json');
Rx = require('rxjs/Rx')


///////////////////////////////////////////////////////////////////////////////////////////////
// STATE
/////////////////////////////////////////////////////////////////////////////////////////////// 
var healthyid = 'c1247ac867ef'
// var unhealthyid = 'pox2'
var anchor = 'b827eb527b42'
var counter = 1
let datetime = 1628732722000
let timeAdd = 21600000
let entries1 = 1
let entries2 = 1
var newDateTime1 = 0
var newDateTime2 = 0
// var bpm = null
// var spO2 = null

///////////////////////////////////////////////////////////////////////////////////////////////
// SOCKETS
/////////////////////////////////////////////////////////////////////////////////////////////// 
// anchorData = zmq.socket('push');
// anchorData.setsockopt(zmq.ZMQ_SNDHWM, 2000);
// anchorData.connect(config.zmqSockets.anchorData.pushpull);

vitals = zmq.socket('push');
vitals.setsockopt(zmq.ZMQ_SNDHWM, 2000);
vitals.connect(config.zmqSockets.vitals.pushpull);

///////////////////////////////////////////////////////////////////////////////////////////////
// OBSERVABLES
/////////////////////////////////////////////////////////////////////////////////////////////// 
healthyPatient$ = Rx.Observable.timer(1000, 3000)
// unhealthyPatient$ = Rx.Observable.timer(1000, 3000)

///////////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////// 
between = function(min, max) {  
  return Math.floor(
    Math.random() * (max - min + 1) + min
  )
}

goodPatientPulse = function() {
  let spO2 = between(95,99)
  let bpm = between(70,120)
  return [bpm, spO2]
}

badPatientPulse = function(toggle) {
  let spO2 = between(85,94)
  let bpm = null
  if (toggle == true)
    bpm = between(60,69)
  else
    bpm = between(121,130)
  return [bpm, spO2]
}

worsePatientPulse = function(toggle) {
  let spO2 = between(75,84)
  let bpm = null
  if (toggle == true)
    bpm = between(50,59)
  else
    bpm = between(131,140)
  return [bpm, spO2]
}

healthyPatient$.subscribe(function() {
  if (entries1 == 1) {
    newDateTime1 = datetime
    entries1 += 1
  }
  else {
    newDateTime1 = newDateTime1 + timeAdd
  }
  [bpm, spO2] = goodPatientPulse()
  // console.log('data from ' + healthyid + '. spO2: ' + spO2 + ', bpm: ' + bpm + ', anchorid: ' + anchor);
  // send data via zmq                
  data = {
    gattid:         healthyid, //uuid: peripheral.uuid,
    time:           newDateTime1,
    // service:        '6e400001b5a3f393e0a9e50e24dcca9e',
    // characteristic: '6e400003b5a3f393e0a9e50e24dcca9e',
    heart_rate:     bpm, 
    spo2:           spO2,
    anchorId:       anchor,
    type: "VITALS",
    tags : "instantaneous"
  };
  console.log ("Sending healthy patient pulse..." + ', bpm: ' + bpm + ', spO2: ' + spO2 + ', time: ' + new Date(newDateTime1))
  return vitals.send(JSON.stringify(data));
})
// unhealthyPatient$.subscribe(function() {
//   let condition = ""
//   if (entries2 == 1) {
//     newDateTime2 = datetime
//     entries2 += 1
//   }
//   else {
//     newDateTime2 = newDateTime2 + timeAdd
//   }
//   if (counter == 1) {
//     [bpm, spO2] = goodPatientPulse()
//     condition = "(good patient)"
//   }
//   else if (counter == 2) {
//     [bpm, spO2] = badPatientPulse()
//     condition = "(bad patient)"
//   }
//   else {
//     [bpm, spO2] = worsePatientPulse()
//     condition = "(worse patient)"
//     counter = 0
//   }
  // counter += 1
  // console.log('data from ' + unhealthyid + '. spO2: ' + spO2 + ', bpm: ' + bpm + ', anchorid: ' + anchor);
    // send data via zmq                
    // data = {
    //   gattid:         unhealthyid, //uuid: peripheral.uuid,
      // service:        '6e400001b5a3f393e0a9e50e24dcca9e',
      // characteristic: '6e400003b5a3f393e0a9e50e24dcca9e',
    //   time:           newDateTime2,
    //   heart_rate:     bpm, 
    //   spo2:           spO2,
    //   anchorId:       anchor
    // };
//     console.log ("Sending unhealthy patient pulse..." + ', bpm: ' + bpm + ', spO2: ' + spO2 + condition + ', time: ' + new Date(newDateTime2))
//     return anchorData.send(JSON.stringify(data)); 
// })
