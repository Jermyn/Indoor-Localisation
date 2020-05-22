var noble = require('noble');

// only scan for devices advertising these service UUID's (default or empty array => any peripherals
var serviceUUids = '6e400001b5a3f393e0a9e50e24dcca9e'; 
var writeUUids = [0xAA5504B10000B56A]
var characteristicsUUids = ['6e400003b5a3f393e0a9e50e24dcca9e']
// allow duplicate peripheral to be returned (default false) on discovery event
var allowDuplicates = true; 

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning([serviceUUids], allowDuplicates);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', function(peripheral) {
    
    console.log('Found device with local name: ' + peripheral.advertisement.localName);
    console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);
    console.log();
    peripheral.connect(function(error) {
      noble.stopScanning();
      noble.startScanning([serviceUUids], allowDuplicates);
      console.log('connected to peripheral: ' + peripheral.uuid);
      peripheral.discoverServices([serviceUUids], function(error, services) {
        // var deviceInformationService = services[0];
        console.log('discovered device information service', services);
        for (var i in services) {
          console.log('  ' + i + ' uuid: ' + services[i].uuid);
        }
        services.forEach(function(service) {
          console.log('found service:', service.uuid);
          service.discoverCharacteristics([], function(err, characteristics) {
            characteristics.forEach(function(characteristic) {
              console.log('found characteristic:', characteristic.uuid);
              if (characteristicsUUids[0] == characteristic.uuid) {
                var deviceCharacteristics = characteristic
                deviceCharacteristics.on('read', function(data, isNotification) {
                  console.log ('reading data', data)
                })
                deviceCharacteristics.subscribe(function(error) {
                  console.log ("notification on")
                })
              }
            })
          })
        });
      });
    });
  });
  //       characteristicsID.write(new Buffer('AA5504B10000B56A', 'hex'), true, function(error) {
  //         console.log ("Write successfully.")
  //           })
  //     });
  //     deviceInformationService.discoverCharacteristics(['cd01'], function(error, characteristics) {
  //       var batteryLevelCharacteristic = characteristics[0];
  //       console.log('discovered notification Level characteristic', 'cd01');

  //       batteryLevelCharacteristic.on('data', function(data, isNotification) {
  //         console.log('battery level is now: ', data + '%');
  //       });

  //       // to enable notify
  //       batteryLevelCharacteristic.subscribe(function(error) {
  //         console.log('data level notification on');
  //       });
  //     });
  //     deviceInformationService.discoverCharacteristics(['cd02'], function(error, characteristics) {
  //         var batteryLevelCharacteristic = characteristics[0];
  //         console.log('discovered data Level characteristic', 'cd02');

  //         // to enable notify
  //         batteryLevelCharacteristic.subscribe(function(error) {
  //           console.log('battery level notification on');
  //         });
  //       });
  //     deviceInformationService.discoverCharacteristics(['cd03'], function(error, characteristics) {
  //       var batteryLevelCharacteristic = characteristics[0];
  //       console.log('discovered Battery Level characteristic', 'cd03');

  //       // to enable notify
  //       batteryLevelCharacteristic.subscribe(function(error) {
  //         console.log('battery level notification on');
  //       });
  //     });
  //     deviceInformationService.discoverCharacteristics(['cd04'], function(error, characteristics) {
  //       var batteryLevelCharacteristic = characteristics[0];
  //       console.log('discovered Battery Level characteristic', 'cd04');


  //       // to enable notify
  //       batteryLevelCharacteristic.subscribe(function(error) {
  //         console.log('battery level notification on');
  //       });
    