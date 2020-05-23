import { createStore, applyMiddleware, compose } from "redux";
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

const store = createStore(rootReducer,
    initialState,
    // compose(
    applyMiddleware(reduxThunk)
        // window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
    // )
);
store.dispatch(Actions.verifyAuth())
store.dispatch(Actions.readPatients())
store.dispatch(Actions.readAssets())
store.dispatch(Actions.readStaff())
store.dispatch(Actions.fetchRooms())
export default store;
