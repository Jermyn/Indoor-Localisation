var FETCH_DEVICES, FETCH_DEVICE_LOCATIONS, _;

_ = require('underscore');

({FETCH_DEVICES, FETCH_DEVICE_LOCATIONS} = require('../actions/actionTypes'));

module.exports = function(state = {
    devices: [],
    staticDevices: [],
    mobileDevices: [],
    deviceLogs: []
  // beaconLogs:     []
  }, action) {
  switch (action.type) {
    case FETCH_DEVICES:
      return Object.assign({}, state, {
        devices: action.payload,
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
    default:
      // when FETCH_BEACON_LOCATIONS
      //   Object.assign {}, state, {
      //     beaconLogs: action.payload.aggregations.id.buckets.map (x) -> x.latest.hits.hits
      //   }
      return state;
  }
};
