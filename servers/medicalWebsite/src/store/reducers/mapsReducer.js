var FETCH_DEVICES, FETCH_MAPS, LOAD_MAP, _, combineFeatures, turf, updateFeatureCollection;

_ = require('underscore');

turf = require('@turf/turf');

({FETCH_MAPS, LOAD_MAP, FETCH_DEVICES} = require('../actions/actionTypes'));

//################################################################################
//# UTILITIES
//################################################################################
combineFeatures = function() {
  return turf.featureCollection(_.compose(_.compact, _.flatten)(arguments));
};

updateFeatureCollection = function({staticDevices, currentMap}) {
  var ref, ref1, ref2;
  return combineFeatures(currentMap != null ? (ref = currentMap.navMesh) != null ? ref.features : void 0 : void 0, currentMap != null ? (ref1 = currentMap.navPath) != null ? ref1.features : void 0 : void 0, currentMap != null ? (ref2 = currentMap.pois) != null ? ref2.features : void 0 : void 0, staticDevices.filter(function(x) {
    return (currentMap != null) && (x.location != null) && x.location.map.id === currentMap.id;
  }).map(function(x) {
    return turf.feature({
      type: 'Point',
      coordinates: [x.location.lng, x.location.lat]
    }, {
      title: x.id,
      device: x,
      type: 'static-device'
    });
  }));
};

//################################################################################
//# EXPORT
//################################################################################
module.exports = function(state = {
    maps: [],
    currentMap: null,
    featureCollection: null,
    staticDevices: []
  }, action) {
  switch (action.type) {
    case FETCH_MAPS:
      return Object.assign({}, state, {
        maps: action.payload
      });
    case LOAD_MAP:
      return Object.assign({}, state, {
        currentMap: action.payload,
        featureCollection: updateFeatureCollection({
          currentMap: action.payload,
          staticDevices: state.staticDevices
        })
      });
    case FETCH_DEVICES:
      return Object.assign({}, state, {
        staticDevices: action.payload,
        featureCollection: updateFeatureCollection({
          currentMap: state.currentMap,
          staticDevices: action.payload
        })
      });
    default:
      return state;
  }
};
