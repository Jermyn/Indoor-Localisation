import { createStore, applyMiddleware } from "redux";
import rootReducer from "../reducers/index";
import reduxThunk from 'redux-thunk';
import * as Actions from '../actions';

const initialState = {
  username: null,
  confirmType: null,
  authenticated: false,
  isAuthenticating: true,
  autherror: null,
  assets: [],
  staff: [],
  patients: [],
  edit: "",
  maps: [],
  map : "",
  devices: [],
  deviceLogs: [],
  staticDevices: [],
  vitals: {},
  info: "",
  beaconCounter: "",
  assetCounter: "",
  patientCounter: "",
  staffCounter: "",
  fetching: false,
  simulation: ""
};

const store = createStore(rootReducer, initialState, applyMiddleware(reduxThunk));
store.dispatch(Actions.verifyAuth())
store.dispatch(Actions.readPatients())
store.dispatch(Actions.readAssets())
store.dispatch(Actions.readStaff())
store.dispatch(Actions.fetchRooms())
export default store;
