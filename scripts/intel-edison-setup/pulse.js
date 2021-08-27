noble = require('noble');
zmq = require('zmq');
config = require('./configs/aws_config.json');
log = require('./log.js')
_ = require ('underscore')
Rx = require('rxjs/Rx')
exec = require('child_process').exec;
Promise = require('bluebird');
// Blinkt = require('node-blinkt');
ibeacon   = require('./iBeacon.js')
//fs = require('graceful-fs');

///////////////////////////////////////////////////////////////////////////////////////////////
// STATE
///////////////////////////////////////////////////////////////////////////////////////////////
var env = {}
var syslog = {}
var poxid = {}
var timers = {}
var waitlist = []

// serviceUuid = '6e400001b5a3f393e0a9e50e24dcca9e';
// characteristicUuid = '6e400003b5a3f393e0a9e50e24dcca9e';
serviceUuid = '180d'
characteristicUuid = '2a37'
beaconUuid = '77777777777777777777777777777777';

///////////////////////////////////////////////////////////////////////////////////////////////
// SOCKETS
/////////////////////////////////////////////////////////////////////////////////////////////// 
vitals = zmq.socket('push');
vitals.setsockopt(zmq.ZMQ_SNDHWM, 2000);
vitals.setsockopt(zmq.ZMQ_TCP_KEEPALIVE, 1);
vitals.connect(config.zmqSockets.vitals.pushpull);
vitals.monitor(3000); // for debug

sms = zmq.socket('push');
sms.setsockopt(zmq.ZMQ_SNDHWM, 2000);
sms.setsockopt(zmq.ZMQ_TCP_KEEPALIVE, 1);
sms.connect(config.zmqSockets.sms.pushpull); //vitals is for sms

battery = zmq.socket('push');
battery.setsockopt(zmq.ZMQ_SNDHWM, 2000);
battery.setsockopt(zmq.ZMQ_TCP_KEEPALIVE, 1);
battery.connect(config.zmqSockets.battery.pushpull);

finalReading = zmq.socket('push');
finalReading.setsockopt(zmq.ZMQ_SNDHWM, 2000);
finalReading.setsockopt(zmq.ZMQ_TCP_KEEPALIVE, 1);
finalReading.connect(config.zmqSockets.finalReading.pushpull);

notify = zmq.socket('pub');
notify.connect(config.zmqSockets.broker.xsub);

///////////////////////////////////////////////////////////////////////////////////////////////
// LED
/////////////////////////////////////////////////////////////////////////////////////////////// 
// pixels = [null, null, null, null, null, null, null, null]; // max 8 pixels
// leds = new Blinkt();
// leds.setup();
// leds.clearAll();
// leds.sendUpdate();

///////////////////////////////////////////////////////////////////////////////////////////////
// PULSE OXIMETER HEADERS
/////////////////////////////////////////////////////////////////////////////////////////////// 

// HEADER = [0xAA, 0x55];
// TOKEN  = 0x0F;
// TYPE_DATA   = 0x01;
// TYPE_STATUS = 0x21;

labelVitals = [0xAA, 0x55, 0x0F, 0x08, 0x01]; // SPO2, PR, 0, PERF*10
labelBattry = [0xAA, 0x55, 0xF0, 0x03, 0x03]; // BATT
labelRawDat = [0xAA, 0x55, 0x0F, 0x07, 0x02]; // RAW0, RAW1, RAW2, RAW3, RAW4
labelCountD = [0xAA, 0x55, 0x0F, 0x06, 0x21, 0x01, 0x02]; // count_down
labelAverag = [0xAA, 0x55, 0x0F, 0x06, 0x21, 0x01, 0x03]; // avg_SPO2, avg_PR
labelResult = [0xAA, 0x55, 0x0F, 0x06, 0x21, 0x01, 0x04]; // result_code


var bufferVitals = Buffer.from(labelVitals);
var bufferBattry = Buffer.from(labelBattry);
var bufferRawDat = Buffer.from(labelRawDat);
var bufferCountD = Buffer.from(labelCountD);
var bufferAverag = Buffer.from(labelAverag);
var bufferResult = Buffer.from(labelResult);

resultCodes = ['No irregularity found',
              'Suspected a little fast pulse',
              'Suspected fast pulse',
              'Suspected short run of fast pulse',
              'Suspected a little slow pulse',
              'Suspected slow pulse',
              'Suspected occasional short pulse interval',
              'Suspected irregular pulse interval',
              'Suspected fast pulse with short pulse interval',
              'Suspected slow pulse with short pulse interval',
              'Suspected slow pulse with irregular pulse interval',
              'Poor signal. Measure again']

var battery_read_count = 0;

///////////////////////////////////////////////////////////////////////////////////////////////
// OBSERVABLES
///////////////////////////////////////////////////////////////////////////////////////////////

scheduleReset$  = Rx.Observable.timer(3600000);
updateSyslog$  = Rx.Observable.timer(1000, 60000);
anchorRequest$ = Rx.Observable.timer(2000);
_anchorStatus$ = new Rx.Subject();
anchorStatus$  = Rx.Observable.merge(_anchorStatus$, Rx.Observable.timer(3000, 900000));
noble$ = Rx.Observable.fromEvent(noble, 'stateChange');
discover$      = Rx.Observable.fromEvent(noble, 'discover');
[_iBeacons$, __macBeacons$] = discover$.partition(function(peripheral) {
  return ibeacon.isBeacon(peripheral.advertisement.manufacturerData);
});
_macBeacons$ = __macBeacons$.share();

macBeacons$ = _macBeacons$.filter(function(b) {
  return b.advertisement.localName === 'RHYTHM+';
}).map(function(b) {
  return {
    transmitterId: b.advertisement.localName,
    receiverId: env.anchor,
    rssi: b.rssi
  };
});
iBeacons$ = _iBeacons$.map(ibeacon.toBeacon).filter(function(b) {
  return b.uuid === '77777777777777777777777777777777';
}).map(function(b) {
  return {
    transmitterId: 'b' + b.minor.toString(),
    receiverId: env.anchor,
    rssi: b.rssi
  };
});
beacons$ = Rx.Observable.merge(iBeacons$, macBeacons$);
gattBeacons$ = _macBeacons$.filter(function(peripheral) {
  return peripheral.state === 'disconnected' && peripheral.advertisement.localName === 'RHYTHM+';;
}).share();
nobleConnect$  = Rx.Observable.fromEvent(noble._bindings, 'connect');
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
socketConnect$ = Rx.Observable.fromEvent(vitals, 'connect', function(fd, ep) {
  return [fd, ep];
});
socketRetry$ = Rx.Observable.fromEvent(vitals, 'connect_retry', function(fd, ep) {
  return [fd, ep];
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

updateSyslog = function() {
  return log.getCurrentState().then(function(res) {    
    return syslog = res;
  }).catch(function(err) {
    console.log('error: cannot update syslog');
    return syslog = {};
  });
};

addPixel = function (uuid) {
  if (!pixels.includes(uuid)) {
    index = _.indexOf(pixels, null);
    if(index !== -1){
      pixels[index] = uuid;
      leds.setPixel(7-index, 0, 0, 255, 0.1);
    }
  }
  return leds.sendUpdate();
}

removePixel = function (uuid) {
  index = _.indexOf(pixels, uuid);
  if(index !== -1) {
    pixels[index] = null;
    for(var i = 0; i <= 7; i++) { // set all pixels to ensure off
      if(pixels[i] == null) {
        leds.setPixel(7-i, 0, 0, 0, 0);
      }
    }
  }
  return leds.sendUpdate();
}

//perfusion index added ~selman
updatePixel = function (uuid, color, perf) 
{
  index = _.indexOf(pixels, uuid);
  if (index !== -1) 
  {
    if(color == 'red')
      leds.setPixel(7-index, 255, 0, 0, 0.1);
    if(color == 'green' && perf < 250 && perf > 0)
    {
      if(perf >= 100)
        leds.setPixel(7-index, 0, 255, 0, 0.1);
      else leds.setPixel(7-index, 200*(1-(perf/100)), 55+200*(perf/100), 0, 0.1);
    }
  }
  return leds.sendUpdate();
}

connectedPeripherals = function() {
  return _.values(noble._peripherals).filter(function({state}) {
    return state === 'connected';
  });
};

anchorStatus = function() {
  var data;
  console.log (syslog)
  data = {
    syslog,
    anchorId: env.anchor,
    gatts: {
      connected: connectedPeripherals().map(function({uuid}) {
        return uuid;
      })
    },
  };
  //notify.connect(config.zmqSockets.broker.xsub); // re-connect socket
  return notify.send([config.notifications.anchorStatus, JSON.stringify(data)]);
};

attemptDiscoverServices = function(peripheral, uuids) {
  if (peripheral.state === 'connected') {    
    return peripheral.discoverServices(uuids);
  } else {
    return console.log(`unable to discover services ${uuids} with state ${peripheral.state}`);
  }
};

attemptConnectPeripheral = function(peripheral) {
  if (waitlist.includes(peripheral.id)) {
    return console.log(`${peripheral.id} is on waitlist`);
  }  

  let base = Math.abs(peripheral.rssi);
      base = (base > 100) ? 100 : base;
      base = (base < 50) ? 50 : base;
  let delay = Math.round(100*Math.random()) + 8*(base - 50);

  waitlist.push(peripheral.id);
  console.log(`attempting to connect to ${peripheral.id} after delay ${delay}`);  

  timers[peripheral.id] = setTimeout( function() {
    waitlist = _.without(waitlist, peripheral.id); // remove from waitlist
    if (peripheral.state === 'disconnected') {      
      return peripheral.connect();
    } else {
      return console.log(`${peripheral.id} is in error state ${peripheral.state}`);
      // known issue: this peripheral is now in an error state and will not be able to connect with this anchor.
      // workaround: schedule process exit after all peripherals disconnected (restart with service)
      //exitOnIdle();
    }
  }, delay);
};

sendBeaconData = function(data) {
  // return beaconData.send(stringifyJSON(data));
  console.log ("Data...")
  console.log (data)
};

sendRawData = function(data) {
  console.log ("Raw Data...")
  console.log (data)
}

///////////////////*****************************************************/////////////////////////////////
///////////////////************       DATA PARSING        **************/////////////////////////////////
///////////////////*****************************************************/////////////////////////////////


// note: packets are 10 bytes long (mostly waveform packets)
//       data and status packets appear in 19 byte bursts of 2 packets
//       remaining 1 byte is appended to start of next burst
readPoxData = function(buffer) 
{    
  //console.log(buffer.toString('hex'));

  //  search buffers inside the buffer for the index of labels of wanted information:
  var indxVitals = buffer.indexOf(bufferVitals);          // spo2, pr and perfusion index
  var indxBattry = buffer.indexOf(bufferBattry);          // battery percentage (0,1,2,3)
  var indxRawDat = buffer.indexOf(bufferRawDat);          // raw pulse signal (5 packets)
  var indxCountD = buffer.indexOf(bufferCountD);          // count down starting from 30s
  var indxAverag = buffer.indexOf(bufferAverag);          // average values of spo2, pr
  var indxResult = buffer.indexOf(bufferResult);          // device's comment on signal


  // first check if labels are alone or together then decide the parsing function

  if(indxAverag != -1) 
    if(indxResult != -1) 
      return readPoxPacketResultAverag(buffer,indxAverag,indxResult);
    else return readPoxPacketAverag(buffer.slice(indxAverag));

  if(indxVitals != -1)
    if(indxRawDat != -1 || indxCountD != -1)
      return readPoxPacketMultiple(buffer,indxVitals,indxRawDat,indxCountD);
    else return readPoxPacketVitals(buffer.slice(indxVitals));

  if(indxRawDat != -1)
    if(indxVitals != -1 || indxCountD != -1)
      return readPoxPacketMultiple(buffer,indxVitals,indxRawDat,indxCountD);
    else return readPoxPacketRawDat(buffer.slice(indxRawDat));

  if(indxCountD != -1)
    if(indxRawDat != -1 || indxVitals != -1)
      return readPoxPacketMultiple(buffer,indxVitals,indxRawDat,indxCountD);
    else return readPoxPacketCountD(buffer.slice(indxCountD));

  // battery is not changing much, so i will read it only when it is alone
  if(indxBattry != -1) 
    return readPoxPacketBattery(buffer.slice(indxBattry));

  
  return {type:'unused'}; // in case nothing have found
};

readPoxPacketVitals = function(buffer)
{
  //console.log('         - received data_vitals: ' + buffer.toString('hex'));
  if (buffer[7] == 0x00)
    return {type:'data_vitals', spo2:buffer[5], pr:buffer[6], perf:buffer[8]};
  else
    return {type:'unused'}; // in case nothing have found
};

readPoxPacketBattery = function(buffer)
{
  //console.log('         - received data_battery: ' + buffer.toString('hex'));
  return {type:'data_battery', battery:buffer[5]};
};

readPoxPacketRawDat = function(buffer)
{
  // console.log('         - received data_raw: ' + buffer.toString('hex'));
  return {type:'data_raw', raw0:buffer[5], raw1:buffer[6], raw2:buffer[7], raw3:buffer[8], raw4:buffer[9]};
};

readPoxPacketCountD = function(buffer)
{
  // console.log('         - received data_count: ' + buffer.toString('hex'));
  return {type:'data_count', cntD:buffer[7]};
};

readPoxPacketAverag = function(buffer)
{
  // console.log('         - received data_avg: ' + buffer.toString('hex'));
  return {type:'data_avg', avg_spo2:buffer[7], avg_pr:buffer[8]};
};

readPoxPacketResultAverag = function(buffer,indxAverag,indxResult)
{
  // console.log('         - received data_result_averag: ' + buffer.toString('hex'));

        var aaa = buffer.slice(indxAverag);
        var bbb = buffer.slice(indxResult);

  if(bbb[7] == 0xFF)      // FF => poor signal
    return {type:'data_result_averag', resultCode:resultCodes[11], avg_spo2:aaa[7], avg_pr:aaa[8]};      
    else if (bbb[7] < 11) // find from array
      return {type:'data_result_averag', resultCode:resultCodes[bbb[7]], avg_spo2:aaa[7], avg_pr:aaa[8]};  
          else            // Not matched
            return {type:'data_result_averag', resultCode:'Unknown resultCode!', avg_spo2:aaa[7], avg_pr:aaa[8]};

  return {type:'unused'};
};


readPoxPacketMultiple = function(buffer,indxVitals,indxRawDat,indxCountD)
{
  // console.log('Multiple Packets: ' + buffer.toString('hex'));

  if(indxVitals != -1 && indxRawDat != -1)
  {
        var aaa = buffer.slice(indxVitals);
        var bbb = buffer.slice(indxRawDat);
        if (aaa[7] == 0x00)
          return {type:'data_vitals_raw', spo2:aaa[5], pr:aaa[6], perf:aaa[8], raw0:bbb[5], raw1:bbb[6], raw2:bbb[7], raw3:bbb[8], raw4:bbb[9]};
        else
          return {type:'unused'}; // in case nothing have found
  }

  if(indxVitals != -1 && indxCountD != -1)
  {
    // console.log('         - CountDown Packets: ' + buffer.slice(indxCountD).toString('hex'));

        var aaa = buffer.slice(indxVitals);
        var bbb = buffer.slice(indxCountD);
        if (aaa[7] == 0x00)
          return {type:'data_vitals_count', spo2:aaa[5], pr:aaa[6], perf:aaa[8], cntD:bbb[7]};
        else
          return {type:'unused'}; // in case nothing have found
  }

  if(indxRawDat != -1 && indxCountD != -1)
  {
    // console.log('         - CountDown Packets: ' + buffer.slice(indxCountD).toString('hex'));

        var aaa = buffer.slice(indxCountD);
        var bbb = buffer.slice(indxRawDat);
        return {type:'data_raw_count', cntD:aaa[7], raw0:bbb[5], raw1:bbb[6], raw2:bbb[7], raw3:bbb[8], raw4:bbb[9]};
  }

  return {type:'unused'};
};

readHRPacket = function (buffer)
{
  data = buffer.toJSON(buffer)
  HRData = data['data'][1] + Math.pow(2,15) % Math.pow(2,16) - Math.pow(2,15)
  return {type: 'hr_raw', hr:HRData}
}

// saveToFile = function(filename, data)
// {
//   var logStream = fs.createWriteStream('/home/pi/node_client/logs/' + filename + '.txt', {flags: 'a'});
//   logStream.write(data + '\n');
// }


///////////////////*****************************************************/////////////////////////////////

exitOnIdle = function() {  
  if(connectedPeripherals().length == 0) {
    process.exit();    
  } else {
    console.log('detected active connections, postponing reset by 5 min');
    setInterval( function() { 
      exitOnIdle();
    }, 300000);
  }
}

// reset bluetooth on start
execAsync('hciconfig hci0 reset');

///////////////////////////////////////////////////////////////////////////////////////////////
// SUBSCRIPTIONS
///////////////////////////////////////////////////////////////////////////////////////////////

noble$.subscribe(function(res) {
  if (res === 'poweredOn') {
    console.log('hci', res, 'start scanning');
    noble.startScanning(serviceUuid, true);
  } else {
    console.log('hci', res, 'stop scanning');
    noble.stopScanning();
  }
});

updateSyslog$.subscribe(function() {
  return updateSyslog();
});

anchorStatus$.subscribe(function() {
  console.log('sending anchor status...')
  return anchorStatus();
});

anchorRequest$.subscribe(function() {  
  let anchor = syslog.address.replace(/:/g,'').replace(/\n/g, '');  
  env.anchor = anchor; // anchor mac address  
});

beacons$.subscribe(function({transmitterId, receiverId, rssi}) {
  var time;
  time = (new Date()).getTime();
  console.log ("Sending raw rssi packets...")
  var message = {
    time: time,
    gattid: transmitterId,
    anchorId: receiverId,
    rssi: rssi,
    tags: 'rawRSSI'
  };
  return sms.send(JSON.stringify(message));
});


gattBeacons$.subscribe(function(peripheral) {
  console.log('scan found:' + peripheral.advertisement.localName + ' - id: ' + peripheral.id + ' - rssi: ' + peripheral.rssi);
  if (peripheral.state == 'connected') {
    return console.log(`already connected to ${peripheral.id}`);
  }
  if (peripheral.rssi < -98) {
    return console.log(`rssi of ${peripheral.id} is below minimum`);
  }  
  return attemptConnectPeripheral(peripheral);
});

nobleConnect$.subscribe(function(uuid) {
  var peripheral;
  peripheral = noble._peripherals[uuid];
  poxid[`${uuid}`] = peripheral.id; // gatt mac address
  console.log(`connected to peripheral ${peripheral.id}`);
  // console.log (peripheral)
  // addPixel(uuid);
  /*if(connectedPeripherals().length == 1) {
    console.log ("re-connecting data sockets");
    anchorData.connect(config.zmqSockets.anchorData.pushpull); // re-connect sockets
    vitals.connect(config.zmqSockets.vitals.pushpull);
  }*/
  noble.stopScanning(); // reset scanning, required for raspberry pi
  noble.startScanning(serviceUuid, true);
  return attemptDiscoverServices(peripheral, serviceUuid)
});

nobleServices$.subscribe(function([peripheralUuid, serviceUuids]) {
  var services;
  console.log(`discovered services for ${peripheralUuid}`);
  services = noble._services[peripheralUuid];
  return serviceUuids.forEach(function(uuid) {
    services[uuid].discoverCharacteristics(characteristicUuid)
  });
});

nobleCharacteristics$.subscribe(function([peripheralUuid, serviceUuid, characteristicsDesc]) {
  var characteristics;
  console.log(`discovered characteristics for ${peripheralUuid}`);
  characteristics = noble._characteristics[peripheralUuid][serviceUuid];
  return characteristicsDesc.forEach(function({uuid}) {
    if (uuid === characteristicUuid) {                     
      characteristics[uuid].subscribe(function(error) {
        console.log ("subscribed to characteristic for " + peripheralUuid);                
      });
    }
  });
});



///////////////////*********** DATA UPLOAD ***************/////////////////////////////////

nobleRead$.subscribe(function([peripheralUuid, serviceUuid, characteristicUuid, data]) 
{
  output = readHRPacket(data)
  var message = 
  {
    gattid:           poxid[`${peripheralUuid}`],
    data:             output.hr,
    anchorId:         env.anchor,
    tags:             'instantaneous'    
  };
  console.log ('data from ' + poxid[`${peripheralUuid}`] + '. hr: ' + output.hr + ', anchorId: ' + env.anchor);
  // sms.send(JSON.stringify(message));      
  return vitals.send(JSON.stringify(message));
})

// nobleRead for PulseOx
// nobleRead$.subscribe(function([peripheralUuid, serviceUuid, characteristicUuid, data]) 
// {
//   console.log ("Reading data...")
//   var buffer = Buffer.from(data);
//   //saveToFile(poxid[`${peripheralUuid}`], buffer.toString('hex'));
//   // poxid[`${peripheralUuid}`] // month day hour
//   var output = readPoxData(buffer);
  
//   if (output.type == 'data_vitals') 
//   {
//     if(output.spo2 > 0 && output.pr > 0) 
//     {
      // console.log('data from ' + poxid[`${peripheralUuid}`] + '. spo2: ' + output.spo2 + 
      //   ', pr: ' + output.pr + ', perfusion index: ' + output.perf + ', anchorid: ' + env.anchor);      

//       var message = 
//       {
//         gattid:         poxid[`${peripheralUuid}`],
//         heart_rate:     output.pr,
//         spo2:           output.spo2,
//         perf_indx:      output.perf,
//         anchorId:       env.anchor,
//         tags:           'instantaneous'
//       };
//       // updatePixel(peripheralUuid, 'green', output.perf); // change green color level based on measurement quality
//       vitals.send(JSON.stringify(message));      
//       return anchorData.send(JSON.stringify(message)); 
//     }
//   }

//   if (output.type == 'data_raw') 
//   {
//     // console.log('data from ' + poxid[`${peripheralUuid}`] + '. Raw data: ' + output.raw0 + ', ' +
//     //   output.raw1 + ', ' + output.raw2 + ', ' + output.raw3 + ', ' + output.raw4 + ', ' + 
//     //   ', anchorid: ' + env.anchor);      

//     var message = 
//     {
//       gattid:         poxid[`${peripheralUuid}`],
//       raw0:           output.raw0,
//       raw1:           output.raw1,
//       raw2:           output.raw2,
//       raw3:           output.raw3,
//       raw4:           output.raw4,
//       anchorId:       env.anchor
//     };
  
//     //return anchorData.send(JSON.stringify(message));     
//   }

//   if (output.type == 'data_battery') 
//   {
  
//     // console.log('data from ' + poxid[`${peripheralUuid}`] + '. battery level: ' + output.battery + '/4 ' + ', anchorid: ' + env.anchor);      
    
//     var message = 
//     {
//       gattid:         poxid[`${peripheralUuid}`],
//       battery:        output.battery,
//       anchorId:       env.anchor
//     };

//     return battery.send(JSON.stringify(message));   
//   }

//   if (output.type == 'data_count') 
//   {
  
//     //console.log('data from ' + poxid[`${peripheralUuid}`] + '. Count down: ' + output.cntD + '/30 ' + ', anchorid: ' + env.anchor);      
    
//     var message = 
//     {
//       gattid:         poxid[`${peripheralUuid}`],
//       count_down:     output.cntD,
//       anchorId:       env.anchor
//     };
//     // updatePixel(peripheralUuid, 'green'); // ongoing measurement procedure..
//     //return anchorData.send(JSON.stringify(message));   
//   } 
 
//   if (output.type == 'data_avg') 
//   {
//     console.log('data from ' + poxid[`${peripheralUuid}`] + '. Final spo2: ' + output.avg_spo2 + 
//       ', Final pr: ' + output.avg_pr + ', anchorid: ' + env.anchor);      

//     var message = 
//     {
//       gattid:               poxid[`${peripheralUuid}`],
//       final_heart_rate:     output.avg_pr,
//       final_spo2:           output.avg_spo2,
//       anchorId:             env.anchor,
//       tags:                 'final'
//     };
//     // updatePixel(peripheralUuid, 'red', 0); // The measurement procedure is finished
//     vitals.send(JSON.stringify(message));
//     return finalReading.send(JSON.stringify(message));   
//   }


//   // Result and Average data might come together in one line:
//   if (output.type == 'data_result_averag') 
//   {
//     console.log('data from ' + poxid[`${peripheralUuid}`] + '. Result Message: ' + output.resultCode + ', anchorid: ' + env.anchor);      
    
//     var message = 
//     {
//       gattid:         poxid[`${peripheralUuid}`],
//       result_code:     output.resultCode,
//       anchorId:       env.anchor
//     };
//     // updatePixel(peripheralUuid, 'red', 0); // The measurement procedure is finished
//     //anchorData.send(JSON.stringify(message));  


//     console.log('data from ' + poxid[`${peripheralUuid}`] + '. Final spo2: ' + output.avg_spo2 + 
//       ', Final pr: ' + output.avg_pr + ', anchorid: ' + env.anchor);      

//     var message = 
//     {
//       gattid:               poxid[`${peripheralUuid}`],
//       final_heart_rate:     output.avg_pr,
//       final_spo2:           output.avg_spo2,
//       anchorId:             env.anchor,
//       tags:                 'final'
//     };
//     vitals.send(JSON.stringify(message));      
//     return finalReading.send(JSON.stringify(message));   
//   }



//   // Multiple data packets:
//   // vitals, raw and count down packets are frequently coming together because
//   // they are sent more often then others. So here i only include their combinations
//   // as pairs. (I ommit battery, since it is not required as others.) ~selman

//   if (output.type == 'data_vitals_raw') 
//   {
//     // console.log('  ## data_vitals_raw ... ');

//     // console.log('data from ' + poxid[`${peripheralUuid}`] + '. Raw data: ' + output.raw0 + ', ' +
//     //   output.raw1 + ', ' + output.raw2 + ', ' + output.raw3 + ', ' + output.raw4 + ', ' + 
//     //   ', anchorid: ' + env.anchor);  

//     var message = 
//     {
//       gattid:         poxid[`${peripheralUuid}`],
//       raw0:           output.raw0,
//       raw1:           output.raw1,
//       raw2:           output.raw2,
//       raw3:           output.raw3,
//       raw4:           output.raw4,
//       anchorId:       env.anchor
//     };
//     //anchorData.send(JSON.stringify(message));  

//     if(output.spo2 > 0 && output.pr > 0) 
//     {
//       console.log('data from ' + poxid[`${peripheralUuid}`] + '. spo2: ' + output.spo2 + 
//         ', pr: ' + output.pr + ', perfusion index: ' + output.perf + ', anchorid: ' + env.anchor);      

//       var message = 
//       {
//         gattid:         poxid[`${peripheralUuid}`],
//         heart_rate:     output.pr,
//         spo2:           output.spo2,
//         perf_indx:      output.perf,
//         anchorId:       env.anchor,
//         tags:           'instantaneous'
//       };
//       // updatePixel(peripheralUuid, 'green', output.perf); // change green color level based on measurement quality
//       vitals.send(JSON.stringify(message));      
//       return anchorData.send(JSON.stringify(message)); 
//     }
//   }

//   if (output.type == 'data_vitals_count') 
//   {
//     // console.log('  ## data_vitals_count ... ');
    
//     //console.log('data from ' + poxid[`${peripheralUuid}`] + '. Count down: ' + output.cntD + '/30 ' + ', anchorid: ' + env.anchor);      
    
//     var message = 
//     {
//       gattid:         poxid[`${peripheralUuid}`],
//       count_down:     output.cntD,
//       anchorId:       env.anchor
//     };
//     // updatePixel(peripheralUuid, 'green'); // ongoing measurement procedure..
//     //anchorData.send(JSON.stringify(message));  

//     if(output.spo2 > 0 && output.pr > 0) 
//     {
//       console.log('data from ' + poxid[`${peripheralUuid}`] + '. spo2: ' + output.spo2 + 
//         ', pr: ' + output.pr + ', perfusion index: ' + output.perf + ', anchorid: ' + env.anchor);      

//       var message = 
//       {
//         gattid:         poxid[`${peripheralUuid}`],
//         heart_rate:     output.pr,
//         spo2:           output.spo2,
//         perf_indx:      output.perf,
//         anchorId:       env.anchor,
//         tags:           'instantaneous'
//       };
//       // updatePixel(peripheralUuid, 'green', output.perf); // change green color level based on measurement quality
//       vitals.send(JSON.stringify(message));      
//       return anchorData.send(JSON.stringify(message)); 
//     }
//   }

//   if (output.type == 'data_raw_count') 
//   {
//     // console.log('  ## data_raw_count ... ');

//     // console.log('data from ' + poxid[`${peripheralUuid}`] + '. Raw data: ' + output.raw0 + ', ' +
//     //   output.raw1 + ', ' + output.raw2 + ', ' + output.raw3 + ', ' + output.raw4 + ', ' + 
//     //   ', anchorid: ' + env.anchor);  

//     var message = 
//     {
//       gattid:         poxid[`${peripheralUuid}`],
//       raw0:           output.raw0,
//       raw1:           output.raw1,
//       raw2:           output.raw2,
//       raw3:           output.raw3,
//       raw4:           output.raw4,
//       anchorId:       env.anchor
//     };
//     //anchorData.send(JSON.stringify(message));  


//     //console.log('data from ' + poxid[`${peripheralUuid}`] + '. Count down: ' + output.cntD + '/30 ' + ', anchorid: ' + env.anchor);      
    
//     var message = 
//     {
//       gattid:         poxid[`${peripheralUuid}`],
//       count_down:     output.cntD,
//       anchorId:       env.anchor
//     };
//     // updatePixel(peripheralUuid, 'green'); // ongoing measurement procedure..
//     //anchorData.send(JSON.stringify(message));  
//   }


// });



nobleDisconnect$.subscribe(function(uuid) {  
  clearTimeout(timers[uuid]); // kill delayed connections
  // removePixel(uuid);  
  // if(connectedPeripherals().length == 0) { //last disconnect
  //   leds.setup();
  //   leds.clearAll();
  //   leds.sendUpdate();
  // }
  //var ddd = new Date(); // save disconnetion time to the log file:
  //saveToFile(`${uuid}`, ddd.toISOString() + ' disconnected... \n\n\n\n');
  return console.log(`${uuid} disconnected`);
});

// testing
socketConnect$.subscribe(function([fd, ep]) {
  console.log('data socket connected to', ep);
});

socketRetry$.subscribe(function([fd, ep]) {  
  console.log('data socket retrying connection to', ep);
});

scheduleReset$.subscribe(function() {
  console.log('scheduled process reset');
  exitOnIdle();
});
