var FETCH_HEARTRATE_VITALS, _;

_ = require('underscore');

({FETCH_HEARTRATE_VITALS} = require('../actions/actionTypes'));

module.exports = function(state = {
    heartrate: []
  }, action) {
  switch (action.type) {
    case FETCH_HEARTRATE_VITALS:
      return Object.assign({}, state, {
       heartrate: action.payload
      });
    default:
      return state;
  }
};
