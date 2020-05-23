var FETCH_DEVICES, FETCH_DEVICE_LOCATIONS, ASSIGN_DEVICES, ASSIGN_BEACON, _;

_ = require('underscore');

({FETCH_DEVICES, FETCH_DEVICE_LOCATIONS, ASSIGN_DEVICES, ASSIGN_BEACON} = require('../actions/actionTypes'));

module.exports = function(state = {
    devices: [],
    staticDevices: [],
    mobileDevices: [],
    deviceLogs: [],
    assignDevices: [],
    beacon: []
  // beaconLogs:     []
  }, action) {
  switch (action.type) {
    case FETCH_DEVICES:
      return Object.assign({}, state, {
        devices: _(action.payload).indexBy('id'),
        staticDevices: action.payload.filter(function({type}) {
          return type === 'static';
        }),
        mobileDevices: action.payload.filter(function({type}) {
          return type === 'mobile';
        })
      });
    case FETCH_DEVICE_LOCATIONS:
      return Object.assign({}, state, {
        deviceLogs: action.payload.aggregations.id.buckets.map(function(x) {
          return x.latest.hits.hits[0]._source;
        })
      });
    case ASSIGN_DEVICES:
      return Object.assign({}, state, {
        assignDevices: action.payload
      });
    case ASSIGN_BEACON:
      return Object.assign({}, state, {
        beacon: action.payload
      });
    default:
      // when FETCH_BEACON_LOCATIONS
      //   Object.assign {}, state, {
      //     beaconLogs: action.payload.aggregations.id.buckets.map (x) -> x.latest.hits.hits
      //   }
      return state;
  }
};
