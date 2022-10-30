from sendVitals import getEdges
import pyrebase

firebaseConfig = {
    "apiKey" :  "AIzaSyBhkxSRwaNi0JxGMiH_1eXITpz602Hvqp8",
    "authDomain" :  "medicalportal-62857.firebaseapp.com",
    "databaseURL": "https://medicalportal-62857.firebaseio.com",
    "projectId": "medicalportal-62857",
    "storageBucket": "",
    "messagingSenderId": "210169025710",
}

firebase = pyrebase.initialize_app(firebaseConfig)

auth = firebase.auth()
#authenticate a user
user = auth.sign_in_with_email_and_password("admin@admin.com", "password")
db = firebase.database()

def homerehab(edges, db):
    uuid = edges['gattid']
    #Firebase
    vital = {"accX": edges['accX'], "accY": edges['accY'], "accZ": edges['accZ'], "timestamp": edges['updatedAt']}
    db.child("vitals/homerehab").child(uuid).set(vital, token=user['idToken'])

def heartrate(edges, db):
    uuid = edges['gattid']
    #Firebase
    vital = {"value": edges['data'], "timestamp": edges['updatedAt']}
    db.child("vitals/heartrate").child(uuid).set(vital, token=user['idToken'])


def main():
    while True:
        edges = getEdges()
        print(edges)
        if edges['device'] == 'imu':
            homerehab(edges, db)
        if edges['device'] == 'hr':
            heartrate(edges, db)

main()