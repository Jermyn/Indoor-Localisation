from twilio.rest import Client
import pyrebase
from elasticsearch import Elasticsearch
import schedule
import time
from datetime import datetime, timedelta

####################################################################################
## State
####################################################################################

HOST_URLS = ["http://127.0.0.1:9200"]
es_conn = Elasticsearch(HOST_URLS)
config = {
  "apiKey": "AIzaSyBhkxSRwaNi0JxGMiH_1eXITpz602Hvqp8",
    "authDomain": "medicalportal-62857.firebaseapp.com",
    "databaseURL": "https://medicalportal-62857.firebaseio.com",
    "projectId": "medicalportal-62857",
    "storageBucket": "",
    "messagingSenderId": "210169025710"
}
firebase = pyrebase.initialize_app(config)
db = firebase.database()
account = "AC2eb02ec5e40a8e34118104508f53b5d1"
token = "f42ff582af35dff92c1d4fd1c6ba1d1a"
client = Client(account, token)
updates = []
allDevicesInRange = []
companyHeader = "SoilBuild Defu Dormitory"
morningTime = 8
afternoonTime = 12
eveningTime = 16
nightTime = 20
operatorNumber = {'Mike': '+6590468811', 'Tushar': '+6597568463', 'Robin': '+6587493007', 'Saraa': '+6587529400'}

####################################################################################
## Methods
####################################################################################

def fetchAllPatients():
  global db
  allPatients = []
  patients = db.child("patients").get()
  for patient in patients.val():
    try:
      allPatients.append(patient["name"])
    except:
      continue
  return allPatients

def getPatientName(poxid):
  global db
  patients = db.child("patients").get()
  for patient in patients.val():
    try:
      if str(patient["devices"][0]["uuid"]) == str(poxid):
        return patient["name"]
    except:
      continue

def getPatientLangByName(patientName):
  global db
  patients = db.child("patients").get()
  for patient in patients.val():
    try:
      if str(patient["name"]) == str(patientName):
        return patient["language"]
    except:
      continue

def getPhoneNumberByName(patientName):
  global db
  patients = db.child("patients").get()
  for patient in patients.val():
    try:
      if str(patient["name"]) == str(patientName):
        return patient["hp"]
    except:
      continue

def fetchFromES(es_database, timeStart, timeEnd):
  search_body = {
    "size": 0,
    "query": {
      "bool": {
        "must": [
          {"type": {"value": "vitals"}}],
          "filter": [
           {
             "range": {
               "@timestamp": {
                 "gte": timeStart,
                 "lte": timeEnd,
                 "time_zone": "+08:00"
               }
             }
           }
          ]
      }
    },
    "aggs": {
      "group_by_device_id": {
        "terms": {
          "size": 30,
          "field": "gattid.keyword"
        }
      }
    }
  }


  resp = es_database.search(
        index = "zmq",
        body = search_body,
  )
  allDevice = resp["aggregations"]["group_by_device_id"]["buckets"]
  for device in allDevice:
    allDevicesInRange.append(device["key"])
  return allDevicesInRange

def translateDevToWorker(allDevicesInRange):
  for pox in allDevicesInRange:
    updates.append(getPatientName(pox))
  return updates



def getAllPatientsYetSubmit(startTime, endTime):
  global es_conn, companyHeader
  notyetsubmitPatients = []
  print ("fetching from es...")
  allDevicesInRange = fetchFromES(es_conn, startTime, endTime)
  updates = translateDevToWorker(allDevicesInRange)
  print ("Checking for patients who have yet to submit...")
  allPatients = fetchAllPatients()
  messageBody = companyHeader + "\n" + "The following residents have yet to submit their measurements:"
  messageWorkerBody = companyHeader + "\n" + "Please take your pulse oximeter measurement now."
  for p in allPatients:
    if p not in updates:
      if p not in notyetsubmitPatients:
          notyetsubmitPatients.append(p)
          patientLang = getPatientLangByName(p)
          hp = getPhoneNumberByName(p)
          if patientLang == 'english':
            strMessage = "Please take your pulse oximeter measurement now."
          elif patientLang == 'chinese':
            strMessage = "请立即进行脉搏血氧仪的测量。"
          elif patientLang == 'tamil':
            strMessage = "தயவுசெய்து உங்கள் துடிப்பு ஆக்சிமீட்டர் அளவீட்டை இப்போது எடுத்துக் கொள்ளுங்கள்."
          elif patientLang == 'bengali':
            strMessage = "দয়া করে এখন আপনার নাড়ির অক্সিমিটার পরিমাপ করুন।"
          elif patientLang == 'hindi':
            strMessage = "कृपया अपनी पल्स ऑक्सीमीटर माप लें।"
          else:
            strMessage = "ကျေးဇူးပြုပြီးသင်၏သွေးခုန်နှုန်းတိုင်းတာမှုကိုယခုယူပါ။"
          messageWorkerBody = companyHeader + "\n" + strMessage
          print (messageWorkerBody + str(p))
          strPatient = p
          messageBody += "\n" + str(p)
          try:
            message = client.messages.create(to=hp, from_="Defu Dorm",
                                         body=messageWorkerBody)
            print (message.status)
          except:
            pass
  print (messageBody)
  try:
    message = client.messages.create(to=operatorNumber['Robin'], from_="Defu Dorm",
                                       body=messageBody)
    print (message.status)
    message = client.messages.create(to=operatorNumber['Saraa'], from_="Defu Dorm",
                                       body=messageBody)
    print (message.status)
  except:
    pass

def getAllPatientsDidNotSubmit(startTime, endTime):
  global es_conn, companyHeader
  didnotsubmitPatients = []
  print ("fetching from es...")
  print (startTime, endTime)
  allDevicesInRange = fetchFromES(es_conn, startTime, endTime)
  updates = translateDevToWorker(allDevicesInRange)
  print ("Checking for patients who did not submit...")
  now   = int(time.time() * 1000)
  dateInitial = datetime.fromtimestamp(int(now/1000))
  allPatients = fetchAllPatients()
  messageBody = companyHeader + "\n" + "The following residents did not submit their measurements:"
  for p in allPatients:
    if p not in updates:
      if p not in didnotsubmitPatients:
        didnotsubmitPatients.append(p)
        strPatient = p
        messageBody += "\n" + str(p)
  if didnotsubmitPatients == []:
    print ("All residents submitted...")
  print (messageBody)
  try:
    message = client.messages.create(to=operatorNumber['Robin'], from_="Defu Dorm",
                                 body=messageBody)
    print (message.status)
    message = client.messages.create(to=operatorNumber['Saraa'], from_="Defu Dorm",
                                       body=messageBody)
    print (message.status)
  except:
    pass


####################################################################################
## SCHEDULES
####################################################################################

schedule.every().day.at("0" + str(morningTime+1) + ":01").do(getAllPatientsYetSubmit, str(datetime.today().strftime("%Y-%m-%d")) + 'T06:00', str(datetime.today().strftime("%Y-%m-%d")) + 'T09:00')
schedule.every().day.at(str(afternoonTime) + ":00").do(getAllPatientsDidNotSubmit, str(datetime.today().strftime("%Y-%m-%d")) + 'T06:00', str(datetime.today().strftime("%Y-%m-%d")) + 'T11:59')
schedule.every().day.at(str(afternoonTime+1) + ":00").do(getAllPatientsYetSubmit, str(datetime.today().strftime("%Y-%m-%d")) + 'T11:40', str(datetime.today().strftime("%Y-%m-%d")) + 'T13:00')
schedule.every().day.at(str(eveningTime) + ":00").do(getAllPatientsDidNotSubmit, str(datetime.today().strftime("%Y-%m-%d")) + 'T11:40', str(datetime.today().strftime("%Y-%m-%d")) + 'T15:59')
schedule.every().day.at(str(eveningTime+1) + ":00").do(getAllPatientsYetSubmit, str(datetime.today().strftime("%Y-%m-%d")) + 'T15:45', str(datetime.today().strftime("%Y-%m-%d")) + 'T17:00')
schedule.every().day.at(str(nightTime) + ":00").do(getAllPatientsDidNotSubmit, str(datetime.today().strftime("%Y-%m-%d")) + 'T15:45', str(datetime.today().strftime("%Y-%m-%d")) + 'T19:59')
schedule.every().day.at(str(nightTime+1) + ":00").do(getAllPatientsYetSubmit, str(datetime.today().strftime("%Y-%m-%d")) + 'T19:45', str(datetime.today().strftime("%Y-%m-%d")) + 'T21:16')
schedule.every().day.at("0" + str(morningTime) + ":00").do(getAllPatientsDidNotSubmit, str((datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d")) + 'T20:00', str(datetime.today().strftime("%Y-%m-%d")) + 'T05:59')
# schedule.every().day.at("17:20").do(getAllPatientsYetSubmit, str(datetime.today().strftime("%Y-%m-%d")) + 'T16:00', str(datetime.today().strftime("%Y-%m-%d")) + 'T18:00')
# schedule.every().day.at("17:20").do(getAllPatientsDidNotSubmit, str(datetime.today().strftime("%Y-%m-%d")) + 'T16:00', str(datetime.today().strftime("%Y-%m-%d")) + 'T18:00')

####################################################################################
## THREADS
####################################################################################

def main():
  interval = 0.5
  now = datetime.now()
  print ("Starting schedule at: " + str(now))
  while True:
    schedule.run_pending()
    time.sleep(interval)
main()
