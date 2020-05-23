var FETCH_DEVICES, FETCH_DEVICE_LOCATIONS, Promise, actions, axios, elkUrl, graphqlUrl, request, restUrl;
axios = require('axios');

Promise = require('bluebird');

graphqlUrl = require('../../config').apiServer.graphql.url;

elkUrl = require('../../config').elkServer.url;

restUrl = require('../../config').apiServer.rest.url;
({FETCH_DEVICES, FETCH_DEVICE_LOCATIONS} = require('./actionTypes'));

request = function({query, variables}) {
    return axios({
      method: 'post',
      url: `${graphqlUrl}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({query, variables})
    });
  };

actions = {
    fetchDeviceLogs: function() {
      return function(dispatch) {
        return axios.get(`${restUrl}/Devices/logs`).then(function({data}) {
          return dispatch({
            type: FETCH_DEVICE_LOCATIONS,
            payload: data
          });
        });
      };
    },
    // fetchBeaconLogs: -> (dispatch) ->
    //   axios.get("#{restUrl}/Beacons/logs")
    //   .then ({data}) -> 
    //     dispatch 
    //       type:     FETCH_BEACON_LOCATIONS
    //       payload:  data
    update: function(device) {
      return function(dispatch) {
        var query, variables;
        // console.log(device);
        variables = {
          input: device
        };
        query = "mutation ($input: CreateDeviceInput!) { updateDevice(input: $input) { id } }";
        return request({query, variables}).then(function() {
          return dispatch(actions.fetch());
        });
      };
    },
    delete: function(id) {
      return function(dispatch) {
        var query, variables;
        variables = {id};
        query = "mutation ($id: String!) { deleteDevice(id: $id) { id } }";
        return request({query, variables}).then(function() {
          return dispatch(actions.fetch());
        });
      };
    },
    create: function(device) {
      return function(dispatch) {
        var query, variables;
        variables = {
          input: device
        };
        query = "mutation ($input: CreateDeviceInput!) { createDevice(input: $input) { id } }";
        return request({query, variables}).then(function({data}) {
          console.log(data);
          return dispatch(actions.fetch());
        });
      };
    },
    fetch: function() {
      return function(dispatch) {
        var query;
        query = "query { devices { id type location anchor { id sensitivity measuredPower offset device { id } } beacon { id device { id } measuredPower } gatt { id device { id } profile connect } } }";
        return request({query}).then(function({data}) {
          return dispatch({
            type: FETCH_DEVICES,
            payload: data.data.devices
          });
        });
      };
    }
  };
  
  module.exports = actions;
  