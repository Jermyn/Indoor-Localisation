import firebase from "firebase/app";
import 'firebase/storage';
import 'firebase/database';
import "firebase/auth";


  // Initialize Firebase
  // var config = {
  //   apiKey: "AIzaSyA8sQqEl1bnktzW0hgfnzYx0fmIJ310Ddc",
  //   authDomain: "image-uploader-728a1.firebaseapp.com",
  //   databaseURL: "https://image-uploader-728a1.firebaseio.com",
  //   projectId: "image-uploader-728a1",
  //   storageBucket: "image-uploader-728a1.appspot.com",
  //   messagingSenderId: "944408595269"
  // };
  // firebase.initializeApp(config);

  let vitalsConfig = {
    apiKey: "AIzaSyC0TRzBu4_nZx7aHsXysIE9fxD-9Dh-JQo",
    authDomain: "vital-simulator.firebaseapp.com",
    databaseURL: "https://vital-simulator.firebaseio.com",
    projectId: "vital-simulator",
    storageBucket: "vital-simulator.appspot.com",
    messagingSenderId: "657874416327"
  };

  let medicalPortalConfig = {
    apiKey: "AIzaSyBhkxSRwaNi0JxGMiH_1eXITpz602Hvqp8",
    authDomain: "medicalportal-62857.firebaseapp.com",
    databaseURL: "https://medicalportal-62857.firebaseio.com",
    projectId: "medicalportal-62857",
    storageBucket: "",
    messagingSenderId: "210169025710"
  }

  let vitalFirebase = firebase.initializeApp(vitalsConfig);
  let medicalPortalFirebase = firebase.initializeApp(medicalPortalConfig, "medicalPortal")


vitalFirebase.auth().signInWithEmailAndPassword("admin@admin.com", "password");
const storage = vitalFirebase.storage();
const databaseRef = vitalFirebase.database().ref();
const ecgRef = databaseRef.child("ecg");
const heartrateRef = databaseRef.child("heartrate");
const medicalPortalDatabaseRef = medicalPortalFirebase.database().ref();

const beaconCountRef = medicalPortalDatabaseRef.child("beaconCounter")
const patientCountRef = medicalPortalDatabaseRef.child("patientCounter")
const assetCountRef = medicalPortalDatabaseRef.child("assetCounter")
const staffCountRef = medicalPortalDatabaseRef.child("staffCounter")
const fakeDataRef = medicalPortalDatabaseRef.child("fakeData")



export {
  beaconCountRef, patientCountRef, assetCountRef, staffCountRef, fakeDataRef, storage, ecgRef, medicalPortalFirebase, heartrateRef, vitalFirebase as default
}
