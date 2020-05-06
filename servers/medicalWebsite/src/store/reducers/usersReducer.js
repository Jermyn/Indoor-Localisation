var AUTH_USER, AUTH_ERROR, SIGN_OUT_USER, ADD_USERNAME, _;

_ = require('underscore');

({AUTH_USER, AUTH_ERROR, SIGN_OUT_USER, ADD_USERNAME} = require('../actions/actionTypes'));

module.exports = function(state = {
    authenticated: null,
    autherror: null,
    isAuthenticating: false,
    username: []
  }, action) {
  switch (action.type) {
    case AUTH_USER:
      return Object.assign({}, state, {
       authenticated: true, autherror: null, isAuthenticating: false
      });
    case AUTH_ERROR:
      return Object.assign({}, state, {
          authenticated: false, autherror: action.payload.message, isAuthenticating: false
      });
    case SIGN_OUT_USER:
      return Object.assign({}, state, {
        authenticated: false, autherror: null, isAuthenticating: false
      });
    case ADD_USERNAME:
      return Object.assign({}, state, {
        username: action.payload
      });
    default:
      return state;
  }
};