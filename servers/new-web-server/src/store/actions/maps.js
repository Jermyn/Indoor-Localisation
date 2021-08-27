var FETCH_MAPS, LOAD_MAP, Promise, UPDATE_FEATURES, _, actions, axios, graphqlUrl, request, restUrl;

axios = require('axios');

Promise = require('bluebird');

graphqlUrl = require('../../config').apiServer.graphql.url;

restUrl = require('../../config').apiServer.rest.url;

_ = require('underscore');

({FETCH_MAPS, LOAD_MAP, UPDATE_FEATURES} = require('./actionTypes'));
console.log (restUrl)
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
  fetch: function() {
    return function(dispatch) {
      var query;
      query = "query { maps { id scale coordinates imageURL navMesh navPath pois } }";
      return request({query}).then(function({data}) {
        return dispatch({
          type: FETCH_MAPS,
          payload: data.data.maps
        });
      });
    };
  },
  create: function(map) {
    return function(dispatch) {
      var patchImage, query, variables;
      query = "mutation ($input: MapInput!) { createMap(input: $input) { id } }";
      variables = {
        input: _.omit(map, 'image')
      };
      patchImage = new Promise(function(resolve, reject) {
        var reader;
        if (!map.image) {
          return resolve();
        } else {
          reader = new FileReader();
          reader.readAsDataURL(map.image);
          reader.onerror = function(err) {
            return reject(err);
          };
          return reader.onload = function(event) {
            return resolve(axios.patch(`${restUrl}/Maps/${map.id}`, {
              image: event.target.result.replace("data:" + map.image.type + ";base64,", ''),
              imageURL: `${restUrl}/Maps/${map.id}/image`
            }));
          };
        }
      });
      return Promise.all([request({query, variables}), patchImage]);
    };
  },
  delete: function(id) {
    return function(dispatch) {
      var query, variables;
      variables = {id};
      query = "mutation ($id: String!) { deleteMap(id: $id) { id } }";
      return request({query, variables}).then(function() {
        dispatch(actions.fetch());
        return dispatch(actions.load(null));
      });
    };
  },
  update: function(map) {
    return function(dispatch) {
      var query, variables;
      variables = {
        input: map
      };
      console.log(map);
      query = "mutation ($input: MapInput!) { updateMap(input: $input) { id } }";
      return request({query, variables}).then(function() {
        dispatch(actions.fetch());
        return dispatch(actions.load(map.id));
      });
    };
  },
  load: function(id) {
    return function(dispatch) {
      var query, variables;
      variables = {id};
      query = "query ($id: String!) { map (id: $id) { id scale coordinates imageURL navMesh navPath pois } }";
      return request({query, variables}).then(function({data}) {
        return dispatch({
          type: LOAD_MAP,
          payload: data.data.map
        });
      }).catch(function(err) {
        return dispatch({
          type: LOAD_MAP,
          payload: null
        });
      });
    };
  },
  updateFeatures: function(features) {
    return function(dispatch) {
      return dispatch({
        type: UPDATE_FEATURES,
        payload: features
      });
    };
  }
};

module.exports = actions;
