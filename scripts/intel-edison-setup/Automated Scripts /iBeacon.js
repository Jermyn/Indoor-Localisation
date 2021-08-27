var APPLE_COMPANY_IDENTIFIER, EXPECTED_IBEACON_DATA_LENGTH, EXPECTED_MANUFACTURER_DATA_LENGTH, IBEACON_TYPE;

EXPECTED_MANUFACTURER_DATA_LENGTH = 25;

APPLE_COMPANY_IDENTIFIER = 0x004c;

IBEACON_TYPE = 0x02;

EXPECTED_IBEACON_DATA_LENGTH = 0x15;

module.exports = {
  isBeacon: function(manufacturerData) {
    return manufacturerData && EXPECTED_MANUFACTURER_DATA_LENGTH <= manufacturerData.length && APPLE_COMPANY_IDENTIFIER === manufacturerData.readUInt16LE(0) && IBEACON_TYPE === manufacturerData.readUInt8(2) && EXPECTED_IBEACON_DATA_LENGTH === manufacturerData.readUInt8(3);
  },
  toBeacon: function(peripheral) {
    return {
      uuid: peripheral.advertisement.manufacturerData.slice(4, 20).toString('hex'),
      major: peripheral.advertisement.manufacturerData.readUInt16BE(20),
      minor: peripheral.advertisement.manufacturerData.readUInt16BE(22),
      rssi: peripheral.rssi,
      measuredPower: peripheral.advertisement.manufacturerData.readInt8(24)
    };
  }
};