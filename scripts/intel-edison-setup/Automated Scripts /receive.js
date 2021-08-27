process.title = "receive"

var noble = require('noble')
var exec  = require('child_process').exec

var uuid = '77777777777777777777777777777777'


function checkBattery (){
  exec('battery-voltage | grep level | grep -o [0-9]*', function (err, stdout, stderr) {
    if (err === null) {
      console.log('battery level:', parseInt(stdout) / 100)
    }
  })
}

checkBattery()

function exists(obj) {
  return (typeof obj !== 'undefined' && obj !== null)
}

var EXPECTED_MANUFACTURER_DATA_LENGTH = 25
var APPLE_COMPANY_IDENTIFIER          = 0x004c
var IBEACON_TYPE                      = 0x02
var EXPECTED_IBEACON_DATA_LENGTH      = 0x15

function isIBeacon(manufacturerData) {
  return manufacturerData &&
    EXPECTED_MANUFACTURER_DATA_LENGTH <= manufacturerData.length &&
    APPLE_COMPANY_IDENTIFIER === manufacturerData.readUInt16LE(0) &&
    IBEACON_TYPE === manufacturerData.readUInt8(2) &&
    EXPECTED_IBEACON_DATA_LENGTH === manufacturerData.readUInt8(3)
}

function exit() {
  process.exit(1)
}

noble.on('stateChange', function(state){
  if (state === 'poweredOn') {
    console.log("start scanning")
    noble.startScanning([], true)
  } else {
    noble.stopScanning()
  }
})

var arg = {
  beaconType: process.argv[2],
  mac:        process.argv[3],
  major:      process.argv[3],
  minor:      process.argv[4]
}

average = null

if (arg.beaconType == '--ibeacon' && exists(arg.major) && exists(arg.minor)) {
  console.log("listening for ibeacon", arg.major, arg.minor)
  // listen for ibeacon
  noble.on('discover', function(peripheral){
    setTimeout(exit, 120000)
    var manufacturerData = peripheral.advertisement.manufacturerData
    if (isIBeacon(manufacturerData)) {
      var major = manufacturerData.readUInt16BE(20)
      var minor = manufacturerData.readUInt16BE(22)
      var measuredPower = manufacturerData.readInt8(24)
      console.log("Measured Power: " + measuredPower)
      if (major == arg.major && minor == arg.minor) {
        if (average == null) {
          average = peripheral.rssi
        } else {
          average = 0.01 * peripheral.rssi + 0.99 * average
        }
        console.log(major, minor, peripheral.rssi, 'average:', average)
      }
    }
  })
} else if (arg.beaconType == '--mac' && exists(arg.mac)) {
  console.log("listening for beacon", arg.mac)
  // listen for mac beacon
  noble.on('discover', function(peripheral){
    if (peripheral.uuid == arg.mac) {

      if (average == null) {
        average = peripheral.rssi
      } else {
        average = 0.01 * peripheral.rssi + 0.99 * average
      }

      console.log(arg.mac, peripheral.rssi, 'average:', average)
    }
  })
} else {
  console.log("usage: --ibeacon major minor | --mac mac")
  process.exit(1)
}
