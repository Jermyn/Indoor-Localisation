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
es_conn = Elasticsearch(
  ['localhost'],
  http_auth=('elastic', 'kibana'),
  scheme="http",
  port=9200,
)
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
token = "218d5a7806074a236ecedffa6eef7372"
client = Client(account, token)
# companyHeader = "SoilBuild Defu Dormitory"
morningTime = 8
afternoonTime = 12
eveningTime = 16
nightTime = 20
operatorNumber = {'Mike': '+6590468811', 'Tushar': '+6597568463', 'Robin': '+6587493007', 'Saraa': '+6587529400', 'Jermyn': '+6591395832', 'Selman': '+6587129735'}

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

def getRoomNumByName(patientName):
  global db
  patients = db.child("patients").get()
  for patient in patients.val():
    try:
      if str(patient["name"]) == str(patientName):
        return patient["room"]["name"]
    except:
      continue

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
  allDevicesInRange = []
  print (timeStart, timeEnd)
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
  print (allDevice)
  for device in allDevice:
    allDevicesInRange.append(device["key"])
  return allDevicesInRange

def translateDevToWorker(allDevicesInRange):
  updates = []
  print (allDevicesInRange)
  for pox in allDevicesInRange:
    if getPatientName(pox) not in updates:
      updates.append(getPatientName(pox))
  return updates



def getAllPatientsYetSubmit(startTime, endTime):
  global es_conn
  notyetsubmitPatients = []
  allPatients = []
  startTime = str(datetime.fromtimestamp(time.time()).strftime("%Y-%m-%d")) + startTime
  endTime = str(datetime.fromtimestamp(time.time()).strftime("%Y-%m-%d")) + endTime
  print ("fetching from es... from %s, %s", str(startTime), str(endTime))
  allDevicesInRange = fetchFromES(es_conn, startTime, endTime)
  updateslist = translateDevToWorker(allDevicesInRange)
  print (updateslist)
  print ("Checking for patients who have yet to submit...")
  allPatients = fetchAllPatients()
  messageBody = "The following residents have yet to submit their measurements:"
  # messageWorkerBody = companyHeader + "\n" + "Please take your pulse oximeter measurement now."
  for p in allPatients:
    if p not in updateslist:
      if p not in notyetsubmitPatients:
          notyetsubmitPatients.append(p)
          if p == 'G. VIJAYAKUMAR' or p == 'WANG LICHENG':
            patientLang = getPatientLangByName(p)
            hp = getPhoneNumberByName(p)
            roomNum = getRoomNumByName(p)
            if patientLang == 'english':
              strMessage = "Please take your pulse oximeter measurement now. After taking your pulse oximeter measurement, if you do not receive a SMS within 1 minute, please go closer to the electronic device with the lights near the bathroom."
            elif patientLang == 'chinese':
              strMessage = "请立即进行脉搏血氧仪的测量。完成脉搏血氧仪的测量后，如果您在1分钟内未收到短信，请靠近浴室附近有灯的电子仪器。"
            elif patientLang == 'tamil':
              strMessage = "தயவுசெய்து உங்கள் துடிப்பு ஆக்சிமீட்டர் அளவீட்டை இப்போது எடுத்துக் கொள்ளுங்கள். உங்கள் துடிப்பு ஆக்சிமீட்டர் அளவீட்டை எடுத்த பிறகு, 1 நிமிடத்திற்குள் நீங்கள் ஒரு எஸ்எம்எஸ் பெறவில்லை என்றால், தயவுசெய்து குளியலறையின் அருகிலுள்ள விளக்குகளுடன் மின்னணு சாதனத்திற்கு அருகில் செல்லுங்கள்."
            elif patientLang == 'bengali':
              strMessage = "দয়া করে এখন আপনার নাড়ির অক্সিমিটার পরিমাপ করুন।. আপনার পালস অক্সিমিটার পরিমাপ করার পরে, আপনি যদি 1 মিনিটের মধ্যে এসএমএস না পান তবে দয়া করে বাথরুমের নিকটবর্তী লাইটগুলি সহ বৈদ্যুতিন ডিভাইসের নিকটে যান।"
            elif patientLang == 'hindi':
              strMessage = "कृपया अपनी पल्स ऑक्सीमीटर माप लें।. अपना पल्स ऑक्सीमीटर माप लेने के बाद, यदि आपको 1 मिनट के भीतर एसएमएस प्राप्त नहीं होता है, तो कृपया बाथरूम के पास रोशनी के साथ इलेक्ट्रॉनिक डिवाइस के करीब जाएं।"
            else:
              strMessage = "ကျေးဇူးပြုပြီးသင်၏သွေးခုန်နှုန်းတိုင်းတာမှုကိုယခုယူပါ။. သင်၏သွေးခုန်နှုန်းတိုင်းတာပြီးနောက်သင် ၁ မိနစ်အတွင်း SMS မရရှိပါကရေချိုးခန်းနားတွင်ရှိသောမီးများရှိအီလက်ထရောနစ်ပစ္စည်းနှင့်နီးပါ။"
            messageWorkerBody = strMessage
            print (messageWorkerBody + str(p))
            strPatient = p
            messageBody += "\n" + str(p) + " (" + str(roomNum) + ")"
            # print (messageBody)
            # try:
            #   message = client.messages.create(to=operatorNumber['Selman'], from_="Defu Dorm",
            #                                body=messageWorkerBody)
            #   print (message.status)
            #   message = client.messages.create(to=operatorNumber['Jermyn'], from_="Defu Dorm",
            #                                body=messageWorkerBody)
            #   print (message.status)
            # except:
            #   pass
  print (messageBody)
  # message_Jermyn = str(startTime) + "to " + str(endTime) + " , " + messageBody
  try:
  #   message = client.messages.create(to=operatorNumber['Robin'], from_="Defu Dorm",
  #                                      body=messageBody)
  #   print (message.status)
  #   message = client.messages.create(to=operatorNumber['Saraa'], from_="Defu Dorm",
  #                                      body=messageBody)
  #   print (message.status)
    message = client.messages.create(to=operatorNumber['Jermyn'], from_="Defu Dorm",
                                       body=messageBody)
    print (message.status)
    message = client.messages.create(to=operatorNumber['Selman'], from_="Defu Dorm",
                                       body=messageBody)
    print (message.status)
  except:
    pass

def getAllPatientsDidNotSubmit(startTime, endTime):
  global es_conn
  didnotsubmitPatients = []
  allPatients = []
  if startTime != 'T20:00':
    startTime = str(datetime.fromtimestamp(time.time()).strftime("%Y-%m-%d")) + startTime
    endTime = str(datetime.fromtimestamp(time.time()).strftime("%Y-%m-%d")) + endTime
  else:
    startTime = str((datetime.fromtimestamp(time.time()) - timedelta(days=1)).strftime("%Y-%m-%d")) + startTime
    endTime = str(datetime.fromtimestamp(time.time()).strftime("%Y-%m-%d")) + endTime
  print ("fetching from es... from %s, %s", str(startTime), str(endTime))
  print (startTime, endTime)
  allDevicesInRange = fetchFromES(es_conn, startTime, endTime)
  updateslist = translateDevToWorker(allDevicesInRange)
  print (updateslist)
  print ("Checking for patients who did not submit...")
  now   = int(time.time() * 1000)
  dateInitial = datetime.fromtimestamp(int(now/1000))
  allPatients = fetchAllPatients()
  messageBody = "The following residents did not submit their measurements:"
  for p in allPatients:
    if p not in updateslist:
      if p not in didnotsubmitPatients:
        if p == 'G. VIJAYAKUMAR' or p == 'WANG LICHENG':
          didnotsubmitPatients.append(p)
          roomNum = getRoomNumByName(p)
          strPatient = p
          messageBody += "\n" + str(p) + " (" + str(roomNum) + ")"
  print (messageBody)
  # message_Jermyn = str(startTime) + "to " + str(endTime) + ", " + messageBody
  try:
  #   message = client.messages.create(to=operatorNumber['Robin'], from_="Defu Dorm",
  #                                body=messageBody)
  #   print (message.status)
  #   message = client.messages.create(to=operatorNumber['Saraa'], from_="Defu Dorm",
  #                                      body=messageBody)
  #   print (message.status)
    message = client.messages.create(to=operatorNumber['Jermyn'], from_="Defu Dorm",
                                       body=messageBody)
    print (message.status)
    message = client.messages.create(to=operatorNumber['Selman'], from_="Defu Dorm",
                                       body=messageBody)
    print (message.status)
  except:
    pass


####################################################################################
## SCHEDULES
####################################################################################

schedule.every().day.at("0" + str(morningTime+1) + ":00").do(getAllPatientsYetSubmit, 'T06:00', 'T09:00')
schedule.every().day.at(str(afternoonTime) + ":00").do(getAllPatientsDidNotSubmit, 'T06:00', 'T11:59')
schedule.every().day.at(str(afternoonTime+1) + ":00").do(getAllPatientsYetSubmit, 'T11:40', 'T13:00')
schedule.every().day.at(str(eveningTime) + ":00").do(getAllPatientsDidNotSubmit, 'T11:40', 'T15:59')
schedule.every().day.at(str(eveningTime+1) + ":00").do(getAllPatientsYetSubmit, 'T15:40', 'T17:00')
schedule.every().day.at(str(nightTime) + ":00").do(getAllPatientsDidNotSubmit, 'T15:40', 'T19:59')
# schedule.every().day.at(str(nightTime+2) + ":03").do(getAllPatientsDidNotSubmit, 'T15:40', 'T19:59')
schedule.every().day.at(str(nightTime+1) + ":00").do(getAllPatientsYetSubmit, 'T19:40', 'T21:00')
# schedule.every().day.at("22:52").do(getAllPatientsYetSubmit, 'T19:40', 'T21:00')
schedule.every().day.at("22:57").do(getAllPatientsDidNotSubmit, 'T19:40', 'T21:00')
schedule.every().day.at("0" + str(morningTime) + ":00").do(getAllPatientsDidNotSubmit, 'T20:00', 'T05:59')
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
