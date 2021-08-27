import pyrebase
config = {
	"apiKey": "AIzaSyBhkxSRwaNi0JxGMiH_1eXITpz602Hvqp8",
    "authDomain": "medicalportal-62857.firebaseapp.com",
    "databaseURL": "https://medicalportal-62857.firebaseio.com",
    "projectId": "medicalportal-62857",
    "storageBucket": "",
    "messagingSenderId": "210169025710"
}
firebase = pyrebase.initialize_app(config)
# Get a reference to the database service
db = firebase.database()

def getPatientInfo(db, patient):
	print (patient['devices'][0]["id"])
	
patients = db.child("patients").get()
for patient in patients.val():
	try:
		getPatientInfo(db, patient)
	except:
		continue
# patient = getPatientInfo(db)