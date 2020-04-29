var combineReducers;

({combineReducers} = require('redux'));

module.exports = combineReducers({
  devices: require('./devicesReducer'),
  maps: require('./mapsReducer')
});
