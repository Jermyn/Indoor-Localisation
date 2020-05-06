var combineReducers;

({combineReducers} = require('redux'));

module.exports = combineReducers({
  devices: require('./devicesReducer'),
  maps: require('./mapsReducer'),
  heartrate: require('./vitalsReducer'),
  patients: require('./patientsReducer'),
  users: require('./usersReducer')
});
