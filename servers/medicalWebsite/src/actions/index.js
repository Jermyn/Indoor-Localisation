import {
    READ_PATIENTS,
    READ_ASSETS,
    READ_STAFF,
    AUTH_USER,
    AUTH_ERROR,
    SIGN_OUT_USER,
    FETCH_MAPDEVICES,
    ASSIGN_ROOM,
    EDIT_ROOM,
    ADD_USERNAME,
    ASSIGN_BEACON,
    ASSIGN_DEVICES,
    CONFIRM_TYPE,
    ADD_PATIENT,
    EDIT_PATIENT,
    REMOVE_PATIENT,
    REMOVE_STAFF,
    REMOVE_ASSET,
    HIGHLIGHT_ASSET,
    HIGHLIGHT_STAFF,
    HIGHLIGHT_PATIENT,
    ADD_STAFF,
    ADD_ASSET,
    FETCH_MAPS,
    LOAD_MAP,
    UPDATE_FEATURES,
    LOAD_INFO,
    FETCH_DEVICES,
    FETCH_DEVICE_LOCATIONS,
    FETCH_SIMULATION_COORDINATES,
    FETCH_NEW_BEACON,
    FETCH_ECG_VITALS,
    FETCH_HEARTRATE_VITALS,
    FETCH_CONTACT_TRACE,
    FETCHING_PROCESS,
    FETCHING_DONE,
    UPDATE_TRACE_DETAILS,
    FETCH_FILTER_TRACE,
    FETCH_PATIENT_COUNT,
    FETCH_ASSET_COUNT,
    FETCH_STAFF_COUNT,
    UPDATE_PATIENT,
    UPDATE_ASSET,
    UPDATE_STAFF,
    FETCH_ROOMS,

    FETCH_DASHBOARD_PATIENTS,
    FETCH_DASHBOARD_PATIENTS_2

} from "../constants/action-types";

import {
    ecgRef,
    heartrateRef,
    beaconCountRef,
    patientCountRef,
    staffCountRef,
    assetCountRef,
    medicalPortalFirebase
} from "../firebase/index"

import axios from 'axios'
import template from "../database/template.json";

var Promise, graphqlUrl, restUrl, _, request
Promise = require('bluebird');

graphqlUrl = require('../config').apiServer.graphql.url;

restUrl = require('../config').apiServer.rest.url;

_ = require('underscore');
//  import restUrl from ('../../config').apiServer.rest.url;

request = function ({query, variables}) {
    return axios({
        method: 'post',
        url: `${graphqlUrl}`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({query, variables})
    });
};

export const addUsername = username => ({
    type: ADD_USERNAME,
    payload: username
});

export const assignBeacon = beacon => ({
    type: ASSIGN_BEACON,
    payload: beacon
});

export const assignDevices = devices => ({
    type: ASSIGN_DEVICES,
    payload: devices
});

export const assignRoom = room => ({
    type: ASSIGN_ROOM,
    payload: room
});

export const fetchAllDevices = () => async dispatch => {
    var query;
    query = "query { devices { id type location anchor { id sensitivity measuredPower offset device { id } } beacon { id device { id } measuredPower } gatt { id device { id } profile connect } } }";
    return request({query}).then(function ({data}) {
        return dispatch({
            type: FETCH_MAPDEVICES,
            payload: data.data.devices
        });
    });
}

export const updateDevice = (device) => async dispatch => {
    var query, variables;
    variables = {
        input: device
    };
    query = "mutation ($input: CreateDeviceInput!) { updateDevice(input: $input) { id } }";
    return request({query, variables}).then(function () {
        return dispatch(fetchAllDevices());
    });
}

export const confirmType = type => ({
    type: CONFIRM_TYPE,
    payload: type
});

export const editPatient = patient => ({
    type: EDIT_PATIENT,
    payload: patient
});

export const editRoom = room => async dispatch => {
    medicalPortalFirebase.database().ref().child(`rooms/${room.id}` + "/vacancy").set(room.vacancy)
}

export const AssignAnchorToRoom = room => async dispatch => {
    medicalPortalFirebase.database().ref().child(`rooms/${room.id}` + "/anchors").set(room.anchor)
}

export const highlightPatient = patients => ({
    type: HIGHLIGHT_PATIENT,
    payload: patients
});

export const highlightAsset = asset => ({
    type: HIGHLIGHT_ASSET,
    payload: asset
});

export const highlightStaff = staff => ({
    type: HIGHLIGHT_STAFF,
    payload: staff
});

export const fetchMaps = maps => ({
    type: FETCH_MAPS,
    payload: maps
});

export const loadMap = map => ({
    type: LOAD_MAP,
    payload: map
});
export const createMap = map => async dispatch => {
    var patchImage, query, variables;
    query = "mutation ($input: MapInput!) { createMap(input: $input) { id } }";
    variables = {
        input: _.omit(map, 'image')
    };
    patchImage = new Promise(function (resolve, reject) {
        var reader;
        if (!map.image) {
            return resolve();
        } else {
            reader = new FileReader();
            reader.readAsDataURL(map.image);
            reader.onerror = function (err) {
                return reject(err);
            };
            return reader.onload = function (event) {
                return resolve(axios.patch(`${restUrl}/Maps/${map.id}`, {
                    image: event.target.result.replace("data:" + map.image.type + ";base64,", ''),
                    imageURL: `${restUrl}/Maps/${map.id}/image`
                }));
            };
        }
    });
    return Promise.all([request({query, variables}), patchImage]);
};

export const updateMap = (map) => async dispatch => {
    var query, variables;
    variables = {
        input: map
    };
    query = "mutation ($input: MapInput!) { updateMap(input: $input) { id } }";
    return request({query, variables}).then(function () {
        dispatch(fetchMaps);
        return dispatch(loadMap(map));
    });
}

export const updateFeatures = features => ({
    type: UPDATE_FEATURES,
    payload: features
});

export const loadInfo = object => ({
    type: LOAD_INFO,
    payload: object
});

export const fetchDevices = devices => ({
    type: FETCH_DEVICES,
    payload: devices
});

export const fetchStaticDevices = staticDevices => ({
    type: FETCH_DEVICES,
    payload: staticDevices
});

export const fetchDeviceLocations = devices => ({
    type: FETCH_DEVICE_LOCATIONS,
    payload: devices
});

export const fetchingProcess = () => ({
    type: FETCHING_PROCESS
});

export const fetchingDone = () => ({
    type: FETCHING_DONE
});

export const fetchRooms = () => async dispatch => {
    medicalPortalFirebase.database().ref().child('rooms')
        .on('value', querySnapshot => {
            let rooms = []
            let snapshot = querySnapshot.val()
            for (var id in snapshot) {
                let item = snapshot[id]
                item.id = id
                rooms.push(item)
            }

            dispatch({
                type: FETCH_ROOMS,
                payload: rooms
            })

        })
}

export const addPatient = (patient) => async dispatch => {
    console.log(patient)
    medicalPortalFirebase.database().ref().child('patients').push().set(patient)
}

export const removePatient = (patient) => async dispatch => {
    medicalPortalFirebase.database().ref().child(`patients/${patient.id}`).remove()
}

export const updatePatient = (patient) => async dispatch => {
    medicalPortalFirebase.database().ref().child(`patients/${patient.id}`).set(patient)
}

export const readPatients = () => async dispatch => {
    medicalPortalFirebase.database().ref().child('patients')
        .on('value', querySnapshot => {
            let patients = []
            let snapshot = querySnapshot.val()
            for (var id in snapshot) {
                let item = snapshot[id]
                item.id = id
                patients.push(item)
            }

            dispatch({
                type: READ_PATIENTS,
                payload: patients
            })

        })
}

export const addAsset = (asset) => async dispatch => {

    medicalPortalFirebase.database().ref().child('assets').push().set(asset)
}

export const removeAsset = (asset) => async dispatch => {
    medicalPortalFirebase.database().ref().child(`assets/${asset.id}`).remove()
}

export const updateAsset = (asset) => async dispatch => {
    medicalPortalFirebase.database().ref().child(`assets/${asset.id}`).set(asset)
}

export const readAssets = () => async dispatch => {
    medicalPortalFirebase.database().ref().child('assets')
        .on('value', querySnapshot => {

            let assets = []
            let snapshot = querySnapshot.val()
            for (var id in snapshot) {
                let item = snapshot[id]
                item.id = id
                assets.push(item)
            }

            dispatch({
                type: READ_ASSETS,
                payload: assets
            })

        })
}

export const addStaff = (staff) => async dispatch => {

    medicalPortalFirebase.database().ref().child('staff').push().set(staff)
}

export const removeStaff = (staff) => async dispatch => {
    medicalPortalFirebase.database().ref().child(`staff/${staff.id}`).remove()
}

export const updateStaff = (staff) => async dispatch => {
    medicalPortalFirebase.database().ref().child(`staff/${staff.id}`).set(staff)
}

export const readStaff = () => async dispatch => {
    medicalPortalFirebase.database().ref().child('staff')
        .on('value', querySnapshot => {

            let staff = []
            let snapshot = querySnapshot.val()
            for (var id in snapshot) {
                let item = snapshot[id]
                item.id = id
                staff.push(item)
            }

            dispatch({
                type: READ_STAFF,
                payload: staff
            })

        })
}

export const signOutUser = () => async dispatch => {
    medicalPortalFirebase.auth().signOut()
        .then(() => {
            dispatch({type: SIGN_OUT_USER})
        })
}

export const verifyAuth = () => async dispatch => {
    medicalPortalFirebase.auth().onAuthStateChanged(user => {
        if (user) {
            let authuser = medicalPortalFirebase.auth().currentUser

            dispatch({
                type: ADD_USERNAME,
                payload: authuser.email
            })
            dispatch({
                type: AUTH_USER
            })

        } else {
            dispatch({
                type: SIGN_OUT_USER
            })
        }
    })
}

export const signInUser = (credentials) => async dispatch => {
    medicalPortalFirebase.auth().signInWithEmailAndPassword(credentials.email, credentials.password)
        .then(res => {
            dispatch({
                type: AUTH_USER
            })
        })
        .catch(err => {
            dispatch({
                type: AUTH_ERROR,
                payload: err
            })
        })
}

export const fetchSimulationCoordinates = () => async dispatch => {
    // let timeStart = Date.now()
    // let timeEnd = Date.now()

    let checkTime = new Date()
    checkTime.setSeconds(checkTime.getSeconds() - 2)
    checkTime = checkTime.toISOString().substr(0, 19);
    let timeStart = checkTime
    let timeEnd = checkTime

    // let timeStart = '2019-04-06T16:55:00'
    // let timeEnd = '2019-04-06T16:55:00'
    let size = 10000
    let coordinateQuery = {
        "size": size,
        "sort": [{"timestamp": {"order": "asc"}}],
        "query": {
            "bool": {
                "must": [
                    {
                        "range": {
                            "@timestamp": {
                                "gte": timeStart,
                                "lte": timeEnd,
                            }
                        }
                    },
                ]
            }
        }
    }

    axios.get(`http://137.132.165.139:9200/simulated-coordinates/_search?scroll=1m`, {
        params: {
            source: JSON.stringify(coordinateQuery),
            source_content_type: 'application/json'
        }
    })
        .then((res) => {
            let fullTrace = res.data.hits.hits
            if (fullTrace.length > 0) {
                dispatch({
                    type: FETCH_SIMULATION_COORDINATES,
                    payload: res.data.hits.hits[0]._source
                });
            }
        })

}

export const fetchContactTrace = (traceDetails) => async dispatch => {
    let timeStart = traceDetails.startTime;
    let timeEnd = traceDetails.endTime;

    timeStart = timeStart + ':00'
    timeEnd = timeEnd + ':00'
    const distance = traceDetails.contactDistance;
    const beacon = traceDetails.name;
    // let beacon = 51
    // let distance = 10
    let index = `precomputed-${beacon}`
    //  let timeStart = `2019-04-06T16:47:55`
    // let timeEnd = `2019-04-07T16:55:00`
    let size = 10000

    dispatch({
        type: FETCHING_PROCESS
    })

    const query = {
        "size": 10000,
        "sort": [{"timestamp": {"order": "asc"}}],
        "query": {
            "bool": {
                "must": [
                    {
                        "range": {
                            "@timestamp": {
                                "gte": timeStart,
                                "lte": timeEnd,
                                "time_zone": "+08:00"
                            }
                        }
                    },
                    {
                        "range": {
                            "distance": {
                                "lte": distance,
                            }
                        }
                    }
                ]
            }
        }
    };

    let coordinateQuery = {
        "size": size,
        "sort": [{"timestamp": {"order": "asc"}}],
        "query": {
            "bool": {
                "must": [
                    {
                        "range": {
                            "@timestamp": {
                                "gte": timeStart,
                                "lte": timeEnd,
                                "time_zone": "+08:00"
                            }
                        }
                    },
                ]
            }
        }
    }

    axios.get(`http://137.132.165.139:9200/simulated-coordinates/_search?scroll=1m`, {
        params: {
            source: JSON.stringify(coordinateQuery),
            source_content_type: 'application/json'
        }
    })
        .then((res) => {
            let fullTrace = res.data.hits.hits
            let map = {}
            let fullShot = []
            let counter = 0
            fullTrace.forEach(timestamp => {
                let item = timestamp._source
                item.key = timestamp._id;
                // item.contact = []
                fullShot.push(item)
                map[timestamp._id] = counter
                counter += 1
            })

            let scroll_size = res.data.hits.total

            let scroll_id = res.data._scroll_id

            let scrollQuery = {
                'scroll': '1m',
                'scroll_id': scroll_id
            }

            getAPI(scrollQuery, fullShot)

            timeStart = encodeURI(timeStart.replace('T', ' '));
            timeEnd = encodeURI(timeEnd.replace('T', ' '));
            let contactURL = `http://137.132.165.139:5001/contacts?beacon=${beacon}&distance=${distance}&startTime=${timeStart}&endTime=${timeEnd}`

            axios.get(contactURL)
                .then((res) => {

                    dispatch({
                        type: UPDATE_TRACE_DETAILS,
                        payload: traceDetails
                    })

                    dispatch({
                        type: FETCH_CONTACT_TRACE,
                        payload: fullShot
                    });

                    dispatch({
                        type: FETCH_FILTER_TRACE,
                        payload: res.data
                    });

                    dispatch({
                        type: FETCHING_DONE
                    })
                }).catch(error => {

                dispatch({
                    type: FETCHING_DONE
                })
            });


        });

}

function getAPI(scrollQuery, fullShot) {

    axios.get(`/_search/scroll`, {
        params: {
            source: JSON.stringify(scrollQuery),
            source_content_type: 'application/json'
        }
    }).then((res) => {

        res.data.hits.hits.forEach(timestamp => {
            let item = timestamp._source
            item.key = timestamp._id;
            // item.contact = []
            fullShot.push(item)

        })

        let scroll_id = res.data._scroll_id
        let scrollQuery = {
            'scroll': '1m',
            'scroll_id': scroll_id
        }
        let scroll_size = res.data.hits.hits.length

        if (scroll_size > 0) {
            getAPI(scrollQuery, fullShot)
        }

    })
}

export const fetchNewBeacon = () => async dispatch => {
    let precomputedPath = `beaconCounter/`
    beaconCountRef.on("value", querySnapshot => {
        dispatch({
            type: FETCH_NEW_BEACON,
            payload: querySnapshot.val()
        })
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    })
}

export const updateBeaconCount = (count) => async dispatch => {
    let newCount = count + 1;
    beaconCountRef.set({
        count: newCount
    })
}

export const fetchPatientCount = () => async dispatch => {
    let precomputedPath = `patientCounter/`
    patientCountRef.on("value", querySnapshot => {
        dispatch({
            type: FETCH_PATIENT_COUNT,
            payload: querySnapshot.val()
        })
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    })
}

export const updatePatientCount = (count) => async dispatch => {
    let newCount = count + 1;
    patientCountRef.set({
        count: newCount
    })
}

export const updateStaffCount = (count) => async dispatch => {
    let newCount = count + 1;
    staffCountRef.set({
        count: newCount
    })
}

export const updateAssetCount = (count) => async dispatch => {
    let newCount = count + 1;
    assetCountRef.set({
        count: newCount
    })
}

export const fetchAssetCount = () => async dispatch => {
    assetCountRef.on("value", querySnapshot => {
        dispatch({
            type: FETCH_ASSET_COUNT,
            payload: querySnapshot.val()
        })
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    })
}

export const fetchStaffCount = () => async dispatch => {
    staffCountRef.on("value", querySnapshot => {
        dispatch({
            type: FETCH_STAFF_COUNT,
            payload: querySnapshot.val()
        })
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    })
}

export const fetchEcgVitals = () => async dispatch => {

    ecgRef.on("value", snapshot => {

        dispatch({
            type: FETCH_ECG_VITALS,
            payload: snapshot.val()
        });
    });
}

export const fetchSpecificEcgVitals = (uuid) => async dispatch => {

    ecgRef.child(uuid).on("value", snapshot => {
        dispatch({
            type: FETCH_ECG_VITALS,
            payload: snapshot.val()
        });
    });
}

export const removeListenerSpecificEcgVitals = (uuid) => async dispatch => {
    ecgRef.child(uuid).off()
}

export const fetchHeartrateVitals = () => async dispatch => {

    heartrateRef.on("value", snapshot => {
        dispatch({
            type: FETCH_HEARTRATE_VITALS,
            payload: snapshot.val()
        });
    });

}

export const fetchSpecificHeartrateVitals = (uuid) => async dispatch => {

    heartrateRef.child(uuid).on("value", snapshot => {
        dispatch({
            type: FETCH_HEARTRATE_VITALS,
            payload: snapshot.val()
        });
    });
}

export const removeListenerSpecificHeartrateVitals = (uuid) => async dispatch => {
    heartrateRef.child(uuid).off()
}

export const fetchDashboardPatients = () => async dispatch => {
    const query = {
        "size": 0,
        "aggs": {
            "filter_1": {
                "terms": {
                    "field": "gattid.keyword",
                    "size": 500,
                    "order": {
                        "_term": "asc"
                    }
                },
                "aggs": {
                    "filter_2": {
                        "top_hits": {
                            "_source": [
                                "gattid",
                                "@timestamp",
                                "anchorId",
                                "heart_rate",
                                "spo2"
                            ],
                            "size": 1,
                            "sort": [
                                {
                                    "@timestamp": {
                                        "order": "desc"
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        }
    }

    axios.get(`/zmq/vitals/_search?scroll=1m`, {
        params: {
            source: JSON.stringify(query),
            source_content_type: 'application/json'
        }
    })
        .then((res) => {
            const buckets = res.data.aggregations.filter_1.buckets.map(bucket => (
                {
                    id: bucket.filter_2.hits.hits[0]._source.gattid,
                    timestamp : bucket.filter_2.hits.hits[0]._source["@timestamp"],
                    achorId: bucket.filter_2.hits.hits[0]._source.anchorId ? bucket.filter_2.hits.hits[0]._source.anchorId : "",
                    heart_rate: bucket.filter_2.hits.hits[0]._source.heart_rate,
                    spo2: bucket.filter_2.hits.hits[0]._source.spo2
                }
            ))

            if (buckets.length > 0) {
                dispatch({
                    type: FETCH_DASHBOARD_PATIENTS,
                    payload: buckets
                });
            }
        })

}

export const fetchDashboardPatients2 = () => async dispatch => {
    const data = template["hits"]["hits"]

    const data2 = data.map(patient => ({
            id: patient.id,
            heart_rate: 20 + Math.floor(Math.random() * 140),
            spo2: patient.spo2
        }
    ))

    dispatch({
        type: FETCH_DASHBOARD_PATIENTS_2,
        payload: data2
    })

}