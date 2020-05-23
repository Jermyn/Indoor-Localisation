var FETCH_PATIENT_COUNT, ADD_PATIENT, REMOVE_PATIENT, UPDATE_PATIENT, EDIT_PATIENT, READ_PATIENTS, _;

_ = require('underscore');

({FETCH_PATIENT_COUNT, ADD_PATIENT, REMOVE_PATIENT, UPDATE_PATIENT, EDIT_PATIENT, READ_PATIENTS} = require('../actions/actionTypes'));

module.exports = function(state = {
    patientCounter: [],
    patient: [],
    edit: [],
    patients: []
  }, action) {
  switch (action.type) {
    case FETCH_PATIENT_COUNT:
      return Object.assign({}, state, {
       patientCounter: action.payload
      });
    case ADD_PATIENT:
      return Object.assign({}, state, {
          patient: [...state.patients, action.payload]
      });
    case EDIT_PATIENT:
      return Object.assign({}, state, {
        edit: action.payload
      });
    case UPDATE_PATIENT:
      return Object.assign({}, state, {
        patients: state.patients.map(patient => 
            (patient.id === action.payload.id) ? action.payload : patient)
      });
    case REMOVE_PATIENT:
      return Object.assign({}, state, {
          patients: state.patients.filter(patient => 
            patient !== action.payload)
      });
    default:
      return state;
  }
};
