import {
  AUTH_USER,
  AUTH_ERROR,
  SIGN_OUT_USER,
  ADD_USERNAME,
  ASSIGN_BEACON,
  ASSIGN_DEVICES,
  ASSIGN_ROOM,
  EDIT_ROOM,
  CONFIRM_TYPE,
  ADD_PATIENT,
  EDIT_PATIENT,
  REMOVE_PATIENT,
  REMOVE_STAFF,
  REMOVE_ASSET,
  ADD_STAFF,
  ADD_ASSET,
  FETCH_MAPS,
  LOAD_MAP,
  LOAD_INFO,
  FETCH_DEVICES,
  HIGHLIGHT_PATIENT,
  FETCH_MAPDEVICES,
  HIGHLIGHT_ASSET,
  HIGHLIGHT_STAFF,
  FETCH_PATIENT_COUNT,
  FETCH_ASSET_COUNT,
  FETCH_STAFF_COUNT,
  FETCH_DEVICE_LOCATIONS,
  FETCH_SIMULATION_COORDINATES,
  FETCH_CONTACT_TRACE,
  FETCH_ECG_VITALS,
  FETCH_HEARTRATE_VITALS,
  FETCHING_PROCESS,
  FETCHING_DONE,
  UPDATE_TRACE_DETAILS,
  UPDATE_PATIENT,
  UPDATE_STAFF,
  UPDATE_ASSET,
  FETCH_FILTER_TRACE,
  FETCH_NEW_BEACON,
  READ_PATIENTS,
  READ_ASSETS,
  READ_STAFF,
  FETCH_ROOMS,
} from "../constants/action-types";
import update from 'immutability-helper';
var combineFeatures, updateFeatureCollection, turf, _;
turf = require ('@turf/turf');
_ = require ('underscore');
const initialState = {
  username: { username: 'staff', },
  confirmType: { type: 'Patient'},
  assets: [],
  staff: [],
  patients: [],
  contactTrace: [],
  edit: "",
  maps: [],
  map : "",
  devices: [],
  deviceLogs: [],
  ecg: {},
  heartrate: {},
  simulation: "",
  info: "",
  fetching: false,
  traceDetails: [],
  filterTrace: [],
  beaconCounter: "",
};

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

const rootReducer = (state = initialState, action) => {
    switch (action.type) {
      case READ_PATIENTS:
      return {...state, patients: action.payload.map(patient => {
        state.patients.forEach(item => {
          if(item.id == patient.id) {
            patient.highlight = item.highlight
          }
        })
        return patient
      })}
      case READ_ASSETS:
      return {...state, assets: action.payload.map(asset => {
        state.assets.forEach(item => {
          if(item.id == asset.id) {
            asset.highlight = item.highlight
          }
        })
        return asset
      })}
      case READ_STAFF:
      return {...state, staff: action.payload.map(staff => {
        state.staff.forEach(item => {
          if(item.id == staff.id) {
            staff.highlight = item.highlight
          }
        })
        return staff
      })}
      case AUTH_USER:
        return {...state, authenticated: true, autherror: null, isAuthenticating: false};
      case SIGN_OUT_USER:
        return {...state, authenticated: false, autherror: null, isAuthenticating: false}
      case AUTH_ERROR:
        return {...state, authenticated: false, autherror: action.payload.message, isAuthenticating: false}
      case ADD_USERNAME:
        return { ...state, username: action.payload };
      case ASSIGN_BEACON:
        return { ...state, beacon: action.payload };
      case ASSIGN_DEVICES:
        return { ...state, assignDevices: action.payload };
      case ASSIGN_ROOM:
        return {...state, assignRoom: action.payload};
      case EDIT_ROOM:
        return {...state, edit: action.payload};
      case CONFIRM_TYPE:
        return { ...state, confirmType: action.payload };
      case ADD_PATIENT:
        return { ...state,  patients: [...state.patients, action.payload] };
      case EDIT_PATIENT:
        return {...state,  edit: action.payload}
      case REMOVE_PATIENT:
        return {...state,  patients: state.patients.filter(patient => patient !== action.payload)}
      case ADD_STAFF:
        return { ...state,  staff: [...state.staff, action.payload] };
      case REMOVE_STAFF:
        return {...state,  staff: state.staff.filter(staffmember => staffmember !== action.payload)}
      case ADD_ASSET:
        return { ...state,  assets: [...state.assets, action.payload] };
      case REMOVE_ASSET:
        return {...state,  assets: state.assets.filter(asset => asset !== action.payload)}
      case FETCH_MAPS:
        return Object.assign({}, state, {
          maps: action.payload
        });
      case LOAD_MAP:
        return Object.assign({}, state, {
          map: action.payload,
          currentMap: action.payload,
          featureCollection: updateFeatureCollection({
            currentMap: action.payload,
            staticDevices: state.staticDevices
          })
        });
      case FETCH_DEVICES:
        return {...state, devices: action.payload, staticDevices: action.payload.filter(function({type}) {
          return type === 'static';
        })
        };
      case FETCH_MAPDEVICES:
        return Object.assign({}, state, {
          featureCollection: updateFeatureCollection({
            currentMap: state.currentMap,
            staticDevices: action.payload
          })
        });
      case FETCH_DEVICE_LOCATIONS:
        return { ...state,  deviceLogs: action.payload.aggregations.id.buckets.map ((x) => x.latest.hits.hits[0]._source) };
      case FETCH_ECG_VITALS:
        return { ...state,  ecg: action.payload };
      case FETCH_SIMULATION_COORDINATES:
        return {...state, simulation: action.payload}
        case FETCH_HEARTRATE_VITALS:
          return { ...state,  heartrate: action.payload };
      case LOAD_INFO:
        return { ...state,  info: action.payload };
      case FETCH_CONTACT_TRACE:
        return { ...state,  contactTrace: action.payload };
      case FETCHING_PROCESS:
        return { ...state,  fetching: true };
      case FETCHING_DONE:
        return { ...state,  fetching: false };
      case UPDATE_TRACE_DETAILS:
        return {...state,  traceDetails: action.payload}
      case FETCH_FILTER_TRACE:
        return {...state,  filterTrace: action.payload}
      case FETCH_NEW_BEACON:
        return {...state,  beaconCounter: action.payload}
      case FETCH_PATIENT_COUNT:
        return {...state, patientCounter: action.payload}
      case FETCH_ASSET_COUNT:
        return {...state, assetCounter: action.payload}
      case FETCH_STAFF_COUNT:
        return {...state, staffCounter: action.payload}
      case FETCH_ROOMS:
        return {...state, rooms: action.payload}
      case UPDATE_PATIENT:
      return {
        ...state,
          patients: state.patients.map(patient => (patient.id === action.payload.id) ? action.payload : patient),
      }
      case UPDATE_STAFF:
      return {
        ...state,
          staff: state.staff.map(staffmem => (staffmem.id === action.payload.id) ? action.payload : staffmem),
      }
      case UPDATE_ASSET:
      return {
        ...state,
          assets: state.assets.map(asset => (asset.id === action.payload.id) ? action.payload : asset),
      }
      case HIGHLIGHT_PATIENT:
        return update(state, {
            patients: {
              [action.payload.index]: {
                highlight: {$set: action.payload.highlight}
              }
            }
        })
        case HIGHLIGHT_ASSET:
          return update(state, {
              assets: {
                [action.payload.index]: {
                  highlight: {$set: action.payload.highlight}
                }
              }
          })
          case HIGHLIGHT_STAFF:
            return update(state, {
                staff: {
                  [action.payload.index]: {
                    highlight: {$set: action.payload.highlight}
                  }
                }
            })
      default:
        return state;
    }
};

export default rootReducer;
