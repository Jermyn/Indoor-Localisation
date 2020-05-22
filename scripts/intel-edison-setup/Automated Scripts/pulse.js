// reset BLE sudo hciconfig hci0 reset
noble = require('noble');
zmq = require('zmq');
config = require('./configs/config.json');
log = require('./log.js')
_ = require ('underscore')
Rx = require('rxjs/Rx')
axios = require ('axios')
exec = require('child_process').exec;
Promise = require('bluebird');

///////////////////////////////////////////////////////////////////////////////////////////////
// STATE
/////////////////////////////////////////////////////////////////////////////////////////////// 
var graphqlUrl = "http://137.132.165.139:3000/graphql"
var env = {}
var syslog = {}
var poxid = {}
serviceUuid = '6e400001b5a3f393e0a9e50e24dcca9e';
characteristicUuid = '6e400003b5a3f393e0a9e50e24dcca9e';

///////////////////////////////////////////////////////////////////////////////////////////////
// SOCKETS
/////////////////////////////////////////////////////////////////////////////////////////////// 
anchorData = zmq.socket('push');
anchorData.setsockopt(zmq.ZMQ_SNDHWM, 2000);
anchorData.connect(config.zmqSockets.anchorData.pushpull);

notify = zmq.socket('pub');
notify.connect(config.zmqSockets.broker.xsub);

///////////////////////////////////////////////////////////////////////////////////////////////
// OBSERVABLES
/////////////////////////////////////////////////////////////////////////////////////////////// 
updateSyslog$ = Rx.Observable.timer(1000, 60000);
anchorRequest$ = Rx.Observable.timer(2000);
_anchorStatus$ = new Rx.Subject();
anchorStatus$     = Rx.Observable.merge(_anchorStatus$, Rx.Observable.timer(3000, 300000))
noble$ = Rx.Observable.fromEvent(noble, 'stateChange');
discover$         = Rx.Observable.fromEvent(noble, 'discover')
nobleConnect$ = Rx.Observable.fromEvent(noble._bindings, 'connect');
nobleDisconnect$ = Rx.Observable.fromEvent(noble._bindings, 'disconnect');
nobleServices$ = Rx.Observable.fromEvent(noble._bindings, 'servicesDiscover', function(peripheralUuid, serviceUuids) {
  return [peripheralUuid, serviceUuids];
});
nobleCharacteristics$ = Rx.Observable.fromEvent(noble._bindings, 'characteristicsDiscover', function(peripheralUuid, serviceUuid, characteristicsDesc) {
  return [peripheralUuid, serviceUuid, characteristicsDesc];
});
nobleRead$ = Rx.Observable.fromEvent(noble._bindings, 'read', function(peripheralUuid, serviceUuid, characteristicUuid, data) {
  return [peripheralUuid, serviceUuid, characteristicUuid, data];
});

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

request = function ({query}) {
    return axios({
        method: 'post',
        url: `${graphqlUrl}`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({query})
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

connectedPeripheral = function() {
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
      connected: connectedPeripheral().map(function({uuid}) {
        return uuid;
      })
    },
  };
  return notify.send([config.notifications.anchorStatus, JSON.stringify(data)]);
};

sendData = function(anchorid, data, anchorData) {
  data.anchorId = anchorid
  anchorData.send(JSON.stringify(data))
}

attemptDiscoverServices = function(peripheral, uuids) {
  if (peripheral.state === 'connected') {
    console.log(`discovering services ${uuids}`);
    return peripheral.discoverServices(uuids);
  } else {
    return console.log(`unable to discover services ${uuids} with state ${peripheral.state}`);
  }
};

attemptConnectPeripheral = function(peripheral) {
  if (peripheral.state === 'disconnected') {
    console.log(`connecting to peripheral ${peripheral.uuid}`);
    return peripheral.connect();
  } else {
    return console.log(`unable to connect ${peripheral.uuid} with state ${peripheral.state}`);
  }
};

readPoxData = function(data) {
  let spO2 = 0;
  let bpm = 0;  
  bufferedData = new Buffer(data);
  if(bufferedData.length >= 19) {
    if(bufferedData[0] == 170 && bufferedData[1] == 85 && bufferedData[2] == 15 && bufferedData[3] == 8 && bufferedData[4] == 1 && bufferedData[5] > 0 && bufferedData[6] > 0) {      
      spO2 = bufferedData[5];
      bpm = bufferedData[6];
    }
    if(bufferedData[11] == 170 && bufferedData[12] == 85 && bufferedData[13] == 15 && bufferedData[14] == 8 && bufferedData[15] == 1 && bufferedData[16] > 0 && bufferedData[17] > 0) {      
      spO2 = bufferedData[16];
      bpm = bufferedData[17];      
    }
  }
  return [spO2, bpm];
}


execAsync(`hciconfig hci0 reset`);
updateSyslog$.subscribe(function() {
  return updateSyslog();
});
anchorStatus$.subscribe(function() {
  console.log ("Sending anchor status...")
  return anchorStatus();
});
anchorRequest$.subscribe(function() {
  let anchor = syslog.address.replace(/:/g,'').replace(/\n/g, '')
  let query = `query { anchor (id: "${anchor}") { device { id } } }`
  request({query}).then(function ({data}) { 
    env.anchor = data.data.anchor.device.id 
  }).catch(function(error) {
    console.log (error)
  })
})
noble$.subscribe(function(res) {
  if (res === 'poweredOn') {
    console.log('hci', res, 'start scanning');
    noble.startScanning([serviceUuid], true);
  } else {
    console.log('hci', res, 'stop scanning');
    noble.stopScanning();
  }
});
discover$.subscribe(function(peripheral) {
  console.log("scan found:" + peripheral.advertisement.localName + " - id: " + peripheral.id);  

  // connect if not already connected
  if (!connectedPeripheral().includes(peripheral.id)) {    
    attemptConnectPeripheral(peripheral)
  }
})
nobleConnect$.subscribe(function(uuid) {
  var peripheral, serviceUUIDs;
  console.log(`connected to ${uuid}`);
  let query = `query { gatt (id: "${uuid}") { device { id } } }`
  request({query}).then(function ({data}) { 
    poxid[`${uuid}`] = data.data.gatt.device.id
  }).catch(function(error) {
    console.log (error)
  })
  peripheral = noble._peripherals[uuid];
  noble.stopScanning();
  noble.startScanning(serviceUuid, true);  
  // serviceUUIDs = _.keys(((ref = cache.gatts[uuid]) != null ? ref.profile : void 0) != null);
  return attemptDiscoverServices(peripheral, serviceUuid);
});
nobleServices$.subscribe(function([peripheralUuid, serviceUuids]) {
  var services;
  console.log(`discovered services ${serviceUuids} for ${peripheralUuid}`);
  services = noble._services[peripheralUuid];
  return serviceUuids.forEach(function(uuid) {
    console.log('found service:', uuid);
    services[uuid].discoverCharacteristics(characteristicUuid)
  });
});
nobleCharacteristics$.subscribe(function([peripheralUuid, serviceUuid, characteristicsDesc]) {
  var characteristics;
  console.log(`discovered ${characteristicsDesc.length} characteristics for ${serviceUuid}`);
  characteristics = noble._characteristics[peripheralUuid][serviceUuid];
  return characteristicsDesc.forEach(function({uuid}) {
    if (uuid === characteristicUuid) {               
      // subscribe to the characteristic
      characteristics[uuid].subscribe(function(error) {
        console.log ("subscribed to " + uuid + " for " + peripheralUuid);
      })
      // return nobleRead$.filter(function([_peripheralUuid, _serviceUuid, _characteristicUuid, _data, _isNotification]) {
      //   return _peripheralUuid === peripheralUuid && _serviceUuid === serviceUuid && _characteristicUuid === uuid;
      // }).take(1).timeout(1000).catch(function(err) {
      //   console.log(`failed to read ${uuid} within time period`);
      //   attemptDisconnectPeripheral(noble._peripherals[peripheralUuid]);
      //   console.log(`read ${uuid} successful`);
      // });
    }
  });
});
nobleRead$.subscribe(function([peripheralUuid, serviceUuid, characteristicUuid, data]) {
  let spO2 = 0; let bpm = 0;
  [spO2, bpm] = readPoxData(data);
  if (spO2 > 0 && bpm > 0) {
    console.log('data from ' + poxid[`${peripheralUuid}`] + '. spO2: ' + spO2 + ', bpm: ' + bpm + ', anchorid: ' + env.anchor);
    // send data via zmq                
    data = {
      gattid:         poxid[`${peripheralUuid}`], //uuid: peripheral.uuid,
      // service:        '6e400001b5a3f393e0a9e50e24dcca9e',
      // characteristic: '6e400003b5a3f393e0a9e50e24dcca9e',
      heart_rate:     bpm, 
      spo2:           spO2,
      anchorId:       env.anchor
    };
    return anchorData.send(JSON.stringify(data));
  }
});
nobleDisconnect$.subscribe(function(uuid) {

    // find peripheral on list and remove it
  for(var i = connectedPeripheral().length - 1; i>=0; i--) {      
    if(connectedPeripheral()[i].id == uuid) {
      connectedPeripheral().splice(i, 1);
    }
  }
  return console.log(`${uuid} disconnected`);
  // send status
  // return _anchorStatus$.next();
});


// var poxIds = [
//   'c03845fd61f2', //pox 0
//   'f32d732ef72c',
//   'e9d88a345bdf',
//   'faa54c2f56da', 
//   'c8eef2af4d6b',
//   'ea2e9031910f',
//   'fe24d49a720f',
//   'e1817c079bee',
//   'eedba2717618',
//   'f13f78592431',
//   'f5be915ef451',
//   'd09c01a81f9f',
//   'ead70333a309',
//   'cd8797dce9c7',
//   'fc4007fa8b79',
//   'f044cab12ac3',
//   'e26140d67c5f',
//   'e25864f9de0d',
//   'd975b0c30e67',
//   'f646bdf64ab7',
//   'd31da0671289',
//   'fc6b721c7b56',
//   'ca564105d715',
//   'e689f853ef15',
//   'd55f1f3673f0',
//   'dbd6da6ef8b7',
//   'ca96a4a2d45d',
//   '7e70c900d8cd'
// ];

// var discover = function(peripheral){  
//   console.log("scan found:" + peripheral.advertisement.localName + " - id: " + peripheral.id);  

//   // connect if not already connected
//   if (!connectedPeripheral().includes(peripheral.id)) {    
//     peripheral.connect(connect.bind({peripheral:peripheral}));
//   }
  
//   // remove device from list when it disconnects  
//   peripheral.once('disconnect', function(err) { 
//     console.log(peripheral.id + " has been disconnected.");

//     // find peripheral on list and remove it
//     for(var i = connectedPeripheral().length - 1; i>=0; i--) {      
//       if(connectedPeripheral()[i].id == peripheral.id) {
//         connectedPeripheral().splice(i, 1);
//       }
//     }        
//   });
// }

// var connect = function(err) {
//   if(err) {
//     console.log('connection error');
//     // retry connection with delay
//     return;
//   }

//   var peripheral = this.peripheral;
//   var poxid
//   // add to list
//   console.log("connected to " + peripheral.uuid + '. ' + connectedPeripheral().length + ' devices connected.');  
//   let query = `query { gatt (id: "${peripheral.uuid}") { device { id } } }`
//   request({query}).then(function ({data}) { 
//     poxid = data.data.gatt.device.id
//   }).catch(function(error) {
//     console.log (error)
//   })
//   // FIX: restart scanning inside the connect routine. otherwise, raspi will not connect to additional devices.  
//   noble.stopScanning();
//   noble.startScanning(serviceUuid, true);  

//   // discover services
//   peripheral.discoverServices( [serviceUuid], function(error, services) {        
//     services.forEach(function(service) {          
      
//       console.log('found service:', service.uuid);

//       // discover characteristics
//       service.discoverCharacteristics([], function(err, characteristics) {
//         characteristics.forEach( function(characteristic) {            
//           if (characteristic.uuid === characteristicUuid) {               
            
//             // subscribe to the characteristic
//             characteristic.subscribe( function(error) {
//               console.log ("subscribed to " + characteristic.uuid);
//             })

//             // read data
//             characteristic.on('read', function(data) {              
//               let spO2 = 0; let bpm = 0;
//               [spO2, bpm] = readPoxData(data);
//               if(spO2 > 0 && bpm > 0) {
//                 // var poxid = 'pox' + poxIds.findIndex( id => id==peripheral.uuid );
//                 console.log('data from ' + poxid + '. spO2: ' + spO2 + ', bpm: ' + bpm + ', anchorid: ' + env.anchor);
                
//                 // send data via zmq                
//                 data = {
//                   gattid:         poxid, //uuid: peripheral.uuid,
//                   // service:        '6e400001b5a3f393e0a9e50e24dcca9e',
//                   // characteristic: '6e400003b5a3f393e0a9e50e24dcca9e',
//                   heart_rate:     bpm, 
//                   spo2:           spO2,
//                   anchorId:       env.anchor
//                 };
//                 anchorData.send(JSON.stringify(data));                
//               }
//             })
            
//           }
//         })
//       })      
//     })
//   })
// };

// start scanning
// noble.on('stateChange', function(state) {
//   if (state === 'poweredOn') {    
//     console.log('scanning');
//     noble.startScanning(serviceUuid, true);
//     noble.on('discover', discover);
//   } else {
//     noble.stopScanning();
//   }
// });
