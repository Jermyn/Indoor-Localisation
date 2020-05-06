var keyMirror;

keyMirror = require('keymirror');

module.exports = keyMirror({
    // devices
    FETCH_DEVICES: null,
    FETCH_DEVICE_LOCATIONS: null,
    // FETCH_BEACON_LOCATIONS:     null
    // maps
    FETCH_MAPS: null,
    LOAD_MAP: null,
    UPDATE_FEATURES: null,
    FETCH_HEARTRATE_VITALS: null,
    FETCH_PATIENT_COUNT: null,
    ADD_PATIENT: null,
    REMOVE_PATIENT: null,
    UPDATE_PATIENT: null,
    EDIT_PATIENT: null,
    READ_PATIENTS: null,
    ASSIGN_DEVICES: null,
    ASSIGN_BEACON: null,
    AUTH_USER: null,
    AUTH_ERROR: null,
    SIGN_OUT_USER: null,
    ADD_USERNAME: null,
});