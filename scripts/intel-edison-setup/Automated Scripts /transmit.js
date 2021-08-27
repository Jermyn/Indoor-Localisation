process.title = "transmit"

log = require('./log.js')
Rx = require('rxjs/Rx')
exec = require('child_process').exec;
Promise = require('bluebird');

var bleno = require('bleno')

var uuid = '77777777777777777777777777777777'
var major = 65535
var minor = 8
var measuredPower = 0
var env = {}
var anchor = 8
///////////////////////////////////////////////////////////////////////////////////////////////
// OBSERVABLES
///////////////////////////////////////////////////////////////////////////////////////////////
// updateSyslog$  = Rx.Observable.timer(1000);
// anchorRequest$ = Rx.Observable.timer(2000);
bleno$ = Rx.Observable.fromEvent(bleno, 'stateChange');

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

///////////////////////////////////////////////////////////////////////////////////////////////
// SUBSCRIPTIONS
///////////////////////////////////////////////////////////////////////////////////////////////
// updateSyslog$.subscribe(function() {
//   return updateSyslog();
// });

// anchorRequest$.subscribe(function() {
//   let anchor = syslog.host.replace(/\n/g, ''); 
//   env.anchor = anchor[3]; // anchor mac address  
// });

bleno$.subscribe(function(res) {
  if (res === 'poweredOn') {
    console.log("started advertising", uuid, major, minor)
    bleno.startAdvertisingIBeacon(uuid, major, minor, measuredPower)
  } else {
    console.log("Stop advertising")
    bleno.stopAdvertising();
  }
})
// bleno.on('stateChange', function (state) {
//   if (state == "poweredOn") {
//     console.log("started advertising", uuid, major, env.anchor)
//     bleno.startAdvertisingIBeacon(uuid, major, env.anchor, measuredPower)
//   }
// })

// execAsync(`hciconfig hci0 reset`);