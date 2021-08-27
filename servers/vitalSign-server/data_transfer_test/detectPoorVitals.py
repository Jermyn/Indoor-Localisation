import json, zmq
import threading
import time
import csv
from collections import defaultdict
from elasticsearch import Elasticsearch
from datetime import datetime
import schedule
from vitals import getEdges
from pprint import PrettyPrinter
import pdb
import pyrebase
from twilio.rest import Client

pp = PrettyPrinter(indent=2)

####################################################################################
## State
####################################################################################
configJSON  = None
with open('../config.json', 'r') as f:
  configJSON = json.load(f)
account = "AC2eb02ec5e40a8e34118104508f53b5d1"
token = "218d5a7806074a236ecedffa6eef7372"
client = Client(account, token)
lowerHealthyPulse = 120
# higherHealthyPulse = 121
healthySpo2 = 94
history       = defaultdict(lambda: {})
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
DURATION_1D = 86400000
DURATION_1H = 3600000
DURATION_30M = 1800000
morningTime = 8
afternoonTime = 12
eveningTime = 16
nightTime = 20
periodState = ['morning', 'afternoon', 'evening', 'night']
companyHeader = "SoilBuild Defu Dormitory"
notyetsubmitPatients = []
didnotsubmitPatients = []
storeTags = []
updates = list()
operatorNumber = {'Mike': '+6590468811', 'Tushar': '+6597568463', 'Robin': '+6587493007', 'Saraa': '+6587529400', 'Jermyn': '+6591395832', 'Selman': '+6587129735'}
myhp = "+6591395832"
rawRSSI_edges = {}
write_file = open('rawRSSI.csv', 'w')
# write_file.truncate(0)
# write_file.write("GattID, AnchorID, Timestamp, RSSI\n")
# print (operatorNumber)
# print (operatorNumber['Mike'], operatorNumber['Tushar'], operatorNumber['Robin'], operatorNumber['Saraa'])

####################################################################################
## Socket
####################################################################################
rawData = zmq.Context().socket(zmq.PUSH)
rawData.setsockopt(zmq.SNDHWM, 10000)
rawData.connect(configJSON['zmqSockets']['rawRSSI']['pushpull'])

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

def getRoomNum(poxid):
  global db
  patients = db.child("patients").get()
  for patient in patients.val():
    try:
      if str(patient["devices"][0]["uuid"]) == str(poxid):
        return patient["name"]
    except:
      continue

def getPatientLang(poxid):
  global db
  patients = db.child("patients").get()
  for patient in patients.val():
    try:
      if str(patient["devices"][0]["uuid"]) == str(poxid):
        return patient["language"]
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

def getBedNum(poxid):
  global db
  patients = db.child("patients").get()
  for patient in patients.val():
    try:
      if str(patient["devices"][0]["uuid"]) == str(poxid):
        return patient["name"]
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

def findTimePeriod(dateNow):
  global morningTime, afternoonTime, eveningTime, nightTime
  if (dateNow.hour > morningTime and dateNow.hour < afternoonTime) or (dateNow.hour == afternoonTime and (dateNow.minute == 0 and dateNow.second == 0)):
    return [dateNow.day, 'morning']
  elif (dateNow.hour > afternoonTime and dateNow.hour < eveningTime) or (dateNow.hour == afternoonTime and (dateNow.minute > 0 and dateNow.second > 0)) or (dateNow.hour == eveningTime and (dateNow.minute == 0 and dateNow.second == 0)):
    return [dateNow.day, 'afternoon']
  elif (dateNow.hour > eveningTime and dateNow.hour < nightTime) or (dateNow.hour == eveningTime and (dateNow.minute > 0 and dateNow.second > 0)) or (dateNow.hour == nightTime and (dateNow.minute == 0 and dateNow.second == 0)):
    return [dateNow.day, 'evening']

def reset():
  global history, updates
  print ("resetting...")
  history = defaultdict(lambda: {})
  updates = list()

def getAllPatientsYetSubmit():
  global updates, notyetsubmitPatients
  print ("Checking for patients who have yet to submit...")
  now   = int(time.time() * 1000)
  dateInitial = datetime.fromtimestamp(int(now/1000))
  allPatients = fetchAllPatients()
  messageBody = companyHeader + "\n" + "The following residents have yet to submit their measurements:"
  messageWorkerBody = companyHeader + "\n" + "Please take your pulse oximeter measurement now."
  for p in allPatients:
    if p not in updates:
      if p not in notyetsubmitPatients:
        if p != 'B. TAMILVANAN' and p!= 'RAHAMAN HAFIZUL' and p != 'WANG LICHENG' and p!= 'ZHANG HAI':
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
          
          message = client.messages.create(to=hp, from_="Defu Dorm",
                                       body=messageWorkerBody)
          print (message.status)
  print (messageBody + str(p))
  # message = client.messages.create(to=operatorNumber['Robin'], from_="Defu Dorm",
  #                                    body=messageBody)
  # message = client.messages.create(to=operatorNumber['Saraa'], from_="Defu Dorm",
  #                                    body=messageBody)
  # print (message.status)

def getAllPatientsDidNotSubmit():
  global updates, didnotsubmitPatients
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
  print (messageBody + str(p))
  # message = client.messages.create(to=operatorNumber['Robin'], from_="Defu Dorm",
  #                              body=messageBody)
  # message = client.messages.create(to=operatorNumber['Saraa'], from_="Defu Dorm",
  #                                    body=messageBody)
  # print (message.status)

def checkFinalReadings(data):
  global lowerHealthyPulse, higherHealthyPulse, healthySpo2
  hr_state = 0
  spo2_state = 0
  if data['final_heart_rate'] <= lowerHealthyPulse:
    hr_state = 1
  else:
    hr_state = 0
  if (data['final_spo2'] > healthySpo2):
    spo2_state = 1
  else:
    spo2_state = 0
  return hr_state, spo2_state

def checkInstantReadings(data):
  global lowerHealthyPulse, higherHealthyPulse, healthySpo2
  hr_state = 0
  spo2_state = 0
  if data['heart_rate'] <= lowerHealthyPulse:
    hr_state = 1
  else:
    hr_state = 0
  if (data['spo2'] > healthySpo2):
    spo2_state = 1
  else:
    spo2_state = 0
  return hr_state, spo2_state

def storeMessages(hr_state, spo2_state, now, data, patientName, patientLang, heart_rate, spo2):
  global history, DURATION_1H, updates
  if (hr_state & spo2_state == 1):
    if '1streading' not in history[patientName].keys() or ('1streading' in history[patientName].keys() and history[patientName]['1streading'] == 'normal'):
      if (now - data['updatedAt'] < DURATION_1H):
        if patientName not in updates:
          updates.append(patientName)
        history[patientName].update(data)
        history[patientName]['1streading'] = 'normal'
        history[patientName]['tags'] = data['tags']
        if patientLang == 'english':
          history[patientName]['1stmessage'] = "Your measurements (PR: " + str(history[patientName][heart_rate]) + ", SpO2: " + str(history[patientName][spo2]) + ") are normal!"
        elif patientLang == 'chinese':
          history[patientName]['1stmessage'] = "您的测量（心率：" + str(history[patientName][heart_rate]) + "，血氧饱和度：" + str(history[patientName][spo2]) + "）是正常的!"
        elif patientLang == 'tamil':
          history[patientName]['1stmessage'] = "உங்கள் அளவீடுகள் (PR: " + str(history[patientName][heart_rate]) + ", SpO2: " + str(history[patientName][spo2]) + ") இயல்பானவை!"
        elif patientLang == 'bengali':
          history[patientName]['1stmessage'] = "আপনার পরিমাপ (বিপি: " + str(history[patientName][heart_rate]) + ", স্পো 2: " + str(history[patientName][spo2]) + ") স্বাভাবিক!"
        elif patientLang == 'hindi':
          history[patientName]['1stmessage'] = "आपके माप (PR: " + str(history[patientName][heart_rate]) + ", SpO2: " + str(history[patientName][spo2]) + ") सामान्य हैं!"
        else:
          history[patientName]['1stmessage'] = "သင်၏တိုင်းတာမှုများ (PR: " + str(history[patientName][heart_rate]) + ", SpO2: " + str(history[patientName][spo2]) + ") သည်ပုံမှန်ဖြစ်သည်။"
  return updates

def sendRawRSSIPackets(edges):
  # global write_file 
  print ("Passing Raw RSSI Packets...")
  print (edges)
  rawData.send_json(edges)
  # write_file.write("Hello\n")
  # write_file.write(edges['gattid'] + "," + edges['anchorId'] + "," + edges['time'] + "," + edges['rssi'] + "\n")

def checkThreshold(edges, now):
  global lowerHealthyPulse, higherHealthyPulse, healthySpo2, history, DURATION_1H, updates, storeTags, rawRSSI_edges
  hr_state = 0
  spo2_state = 0
  for poxid, data in edges.items():
    if data['tags'] != 'rawRSSI':
      patientName = getPatientName(poxid)
      patientRm = getRoomNum(poxid)
      patientBed = getBedNum(poxid)
      patientLang = getPatientLang(poxid)
      if data['tags'] == 'final':
        hr_state, spo2_state = checkFinalReadings(data)
        updates = storeMessages(hr_state, spo2_state, now, data, patientName, patientLang, 'final_heart_rate', 'final_spo2')
      elif data['tags'] == 'instantaneous':
        hr_state, spo2_state = checkInstantReadings(data)
        updates = storeMessages(hr_state, spo2_state, now, data, patientName, patientLang, 'heart_rate', 'spo2')
    else:
      rawRSSI_edges[poxid] = data
      sendRawRSSIPackets(data)
    # checkfinalTime = int(time.time()*1000)
    # print (data['tags'])
    # storeTags.append(data['tags'])
    # print (now - data['updatedAt'])
    # if 'instantaneous' in storeTags and (checkfinalTime - data['updatedAt'] <= 30000):
    #   if 'final' in storeTags:
    #     choice = 1
    #   else:
    #     choice = 2
    #   storeTags = []
    # print ("choice: " + str(choice))
    # if choice == 1:
    #   if data['final_heart_rate'] <= lowerHealthyPulse:
    #     hr_state = 1
    #   else:
    #     hr_state = 0
    #   if (data['final_spo2'] > healthySpo2):
    #     spo2_state = 1
    #   else:
    #     spo2_state = 0
    # elif choice == 2:
    #   if data['heart_rate'] <= lowerHealthyPulse:
    #     hr_state = 1
    #   else:
    #     hr_state = 0
    #   if (data['spo2'] > healthySpo2):
    #     spo2_state = 1
    #   else:
    #     spo2_state = 0
    # if data['heart_rate'] <= lowerHealthyPulse:
    #   hr_state = 1
    # else:
    #   hr_state = 0
    # if (data['spo2'] > healthySpo2):
    #   spo2_state = 1
    # else:
    #   spo2_state = 0
    # if (hr_state & spo2_state == 1):
    #   if '1streading' not in history[patientName].keys() or ('1streading' in history[patientName].keys() and history[patientName]['1streading'] == 'normal'):
    #     if (now - data['updatedAt'] < DURATION_1H):
    #       if patientName not in updates:
    #         updates.append(patientName)
    #       history[patientName].update(data)
    #       history[patientName]['1streading'] = 'normal'
    #       if patientLang == 'english':
    #         history[patientName]['1stmessage'] = "Your measurements (PR: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ") are normal!"
    #       elif patientLang == 'chinese':
    #         history[patientName]['1stmessage'] = "您的测量（心率：" + str(history[patientName]['heart_rate']) + "，血氧饱和度：" + str(history[patientName]['spo2']) + "）是正常的!"
    #       elif patientLang == 'tamil':
    #         history[patientName]['1stmessage'] = "உங்கள் அளவீடுகள் (PR: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ") இயல்பானவை!"
    #       elif patientLang == 'bengali':
    #         history[patientName]['1stmessage'] = "আপনার পরিমাপ (বিপি: " + str(history[patientName]['heart_rate']) + ", স্পো 2: " + str(history[patientName]['spo2']) + ") স্বাভাবিক!"
    #       elif patientLang == 'hindi':
    #         history[patientName]['1stmessage'] = "आपके माप (PR: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ") सामान्य हैं!"
    #       else:
    #         history[patientName]['1stmessage'] = "သင်၏တိုင်းတာမှုများ (PR: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ") သည်ပုံမှန်ဖြစ်သည်။"
      # else: 
      #   if history[patientName]['1streading'] == 'abnormal':
      #     if (now - data['updatedAt'] < DURATION_1H):
      #       if patientName not in updates:
      #         updates.append(patientName)
      #       history[patientName].update(data)
      #       history[patientName]['2ndReading'] = 'normal'
      #       history[patientName]['2ndOperatornormalmessage'] = "2nd set of readings from " + str(patientName) + " in " + str(patientRm) + " Bed #" + str(patientBed) + " has normal readings (HR: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ")."
      #       if patientLang == 'english':
      #         history[patientName]['2ndnormalmessage'] = "Your measurements (BP: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ") are normal!"
      #       elif patientLang == 'chinese':
      #         history[patientName]['2ndnormalmessage'] = "您的测量（血压：" + str(history[patientName]['heart_rate']) + "，血氧饱和度：" + str(history[patientName]['spo2']) + "）是正常的!"
      #       elif patientLang == 'tamil':
      #         history[patientName]['2ndnormalmessage'] = "உங்கள் அளவீடுகள் (BP: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ") இயல்பானவை!"
      #       elif patientLang == 'bengali':
      #         history[patientName]['2ndnormalmessage'] = "আপনার পরিমাপ (বিপি: " + str(history[patientName]['heart_rate']) + ", স্পো 2: " + str(history[patientName]['spo2']) + ") স্বাভাবিক!"
      #       elif patientLang == 'hindi':
      #         history[patientName]['2ndnormalmessage'] = "आपके माप (BP: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ") सामान्य हैं!"
      #       else:
      #         history[patientName]['2ndnormalmessage'] = "သင်၏တိုင်းတာမှုများ (BP: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ") သည်ပုံမှန်ဖြစ်သည်။"
    # else:
    #   if patientName not in updates:
    #       updates.append(patientName)
    #   history[patientName].update(data)
    #   if patientLang == 'english':
    #       history[patientName]['2ndmessage'] = "Please retake your pulse oximeter measurement now."
    #   elif patientLang == 'chinese':
    #     history[patientName]['2ndmessage'] = "请立即重新进行脉搏血氧仪的测量。"
    #   elif patientLang == 'tamil':
    #     history[patientName]['2ndmessage'] = "உங்கள் துடிப்பு ஆக்சிமீட்டர் அளவீட்டை இப்போது மீண்டும் எடுக்கவும்."
    #   elif patientLang == 'bengali':
    #     history[patientName]['2ndmessage'] = "দয়া করে এখনই আপনার পালস অক্সিমিটার পরিমাপটি পুনরায় গ্রহণ করুন।"
    #   elif patientLang == 'hindi':
    #     history[patientName]['2ndmessage'] = "कृपया अपनी पल्स ऑक्सीमीटर माप को अब वापस लें।"
    #   else:
    #     history[patientName]['2ndmessage'] = "ကျေးဇူးပြုပြီးသင်၏သွေးခုန်နှုန်းတိုင်းတာမှုအတိုင်းအတာကိုယခုပြန်ယူပါ။"
    #   if '1stsms' not in history[patientName].keys() or ('1stsms' in history[patientName].keys() and history[patientName]['1stsms'] == False):
    #     if (now - data['updatedAt'] < DURATION_1H):
    #       history[patientName]['1streading'] = 'abnormal'
    #       history[patientName]['1stOperatormessage'] = str(patientName) + " in " + str(patientRm) + " Bed #" + str(patientBed) + " has abnormal readings (HR: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ")."
    #       if patientLang == 'english':
    #         history[patientName]['1stmessage'] = "Please retake your measurement in 60 mins after receiving another SMS from us."
    #       elif patientLang == 'chinese':
    #         history[patientName]['1stmessage'] = "在收到我们的另一条短信后，请在60分钟内重新进行测量。"
    #       elif patientLang == 'tamil':
    #         history[patientName]['1stmessage'] = "எங்களிடமிருந்து மற்றொரு எஸ்எம்எஸ் பெற்ற பிறகு உங்கள் அளவீட்டை 60 நிமிடங்களில் மீண்டும் பெறுங்கள்."
    #       elif patientLang == 'bengali':
    #         history[patientName]['1stmessage'] = "আমাদের কাছ থেকে অন্য কোনও এসএমএস পাওয়ার পরে 60 মিনিটের মধ্যে আপনার পরিমাপটি আবার গ্রহণ করুন ake"
    #       elif patientLang == 'hindi':
    #         history[patientName]['1stmessage'] = "हमसे एक और एसएमएस प्राप्त करने के बाद कृपया 60 मिनट में अपने माप को फिर से लें।"
    #       else:
    #         history[patientName]['1stmessage'] = "ကျွန်ုပ်တို့ထံအခြား SMS လက်ခံရရှိပြီးနောက်မိနစ် ၆၀ အတွင်းပြန်လည်တိုင်းတာပါ။"
    #       history[patientName]['2ndReading'] = None
    #   elif history[patientName]['2ndsms'] == True:
    #     print ("time elapsed since 2nd sms: " + str(now - history[patientName]['2ndsmsTime']))
    #     if now - data['updatedAt'] < DURATION_1H:
    #       if patientLang == 'english':
    #         history[patientName]['2ndabnormalmessage'] = "Please make a phone call to the person in-charge of the dorm."
    #       elif patientLang == 'chinese':
    #         history[patientName]['2ndabnormalmessage'] = "请给宿舍负责人打个电话。"
    #       elif patientLang == 'tamil':
    #         history[patientName]['2ndabnormalmessage'] = "தங்குமிடத்தின் பொறுப்பாளருக்கு தொலைபேசி அழைப்பு விடுங்கள்."
    #       elif patientLang == 'bengali':
    #         history[patientName]['2ndabnormalmessage'] = "অনুগ্রহ করে ডরমের ইনচার্জ ব্যক্তিকে একটি ফোন কল করুন।"
    #       elif patientLang == 'hindi':
    #         history[patientName]['2ndabnormalmessage'] = "कृपया डॉर्म के प्रभारी व्यक्ति को फोन करें।"
    #       else:
    #         history[patientName]['2ndabnormalmessage'] = "အဆောင်ရှိတာဝန်ရှိသူအားဖုန်းဆက်ပါ။"
    #       history[patientName]['2ndOperatorabnormalmessage'] = "2nd set of readings from " + str(patientName) + " in " + str(patientRm) + " Bed #" + str(patientBed) + " has abnormal readings (HR: " + str(history[patientName]['heart_rate']) + ", SpO2: " + str(history[patientName]['spo2']) + ")."
    #       history[patientName]['2ndReading'] = 'abnormal'
    #     elif now - history[patientName]['2ndsmsTime'] >= DURATION_30M:
    #       history[patientName]['operatormessage'] = "2nd set of readings from " + str(patientName) + " in " + str(patientRm) + " Bed #" + str(patientBed) + " have not been submitted."
    # elif (hr_state ^ spo2_state == 1):
    #   updates.add(patientName)
    #   history[patientName].update(data)
    #   history[patientName]['1streading'] = 'abnormal'
    #   # history[patientName]["1stmessage"] = "Your heart rate is a little high. We will send you another SMS in an hour to take another measurement."
    #   history[patientName]["2ndmessage"] = "Please take another measurement with your device."
    #   if hr_state == 0:
    #     if (now - data['updatedAt'] < DURATION_1H):
    #       # updates.add(patientName)
    #       # history[patientName].update(data)
    #       history[patientName]['2ndReading'] = False
    #       # history[patientName]['sms'] = False
    #       # history[patientName]["message"] = str(patientName) + ", your HR reading is " + str(data)
    #       history[patientName]["1stmessage"] = "Your heart rate is a little high. We will send you another SMS in an hour to take another measurement."
    #       # history[patientName]["2ndmessage"] = "Please take another measurement with your device."
    #     else:
    #       # updates.add(patientName)
    #       # history[patientName].update(data)
    #       history[patientName]['2ndReading'] = True
    #       # history[patientName]['2ndsms'] = True
    #   else:
    #     if (now - data['updatedAt'] < DURATION_1H):
    #       # updates.add(patientName)
    #       # history[patientName].update(data)
    #       history[patientName]['2ndReading'] = False
    #       # history[patientName]['sms'] = False
    #       history[patientName]["1stmessage"] = "Your blood oxygen level is a little low. We will send you another SMS in an hour to take another measurement."
    #     else:
    #       # updates.add(patientName)
    #       # history[patientName].update(data)
    #       history[patientName]['2ndReading'] = True
    #       # history[patientName]['2ndsms'] = False
    # elif (hr_state & spo2_state == 0):
    #   updates.add(patientName)
    #   history[patientName].update(data)
    #   history[patientName]['1streading'] = 'abnormal'
    #   history[patientName]["2ndmessage"] = "Please take another measurement with your device."
    #   if (now - data['updatedAt'] < DURATION_1H):
    #     # updates.add(patientName)
    #     # history[patientName].update(data)
    #     history[patientName]['2ndReading'] = False
    #     # history[patientName]['sms'] = False
    #     history[patientName]["1stmessage"] = "Your heart rate is a little high and your blood oxygen level is a little low. We will send you another SMS in an hour to take another measurement."
    #   else:
    #     # updates.add(patientName)
    #     # history[patientName].update(data)
    #     history[patientName]['2ndReading'] = True
    #     # history[patientName]['2ndsms'] = False
  return updates


def processEdges(interval): 
  global history, client, DURATION_1H, periodState, companyHeader, notyetsubmitPatients
  edges = getEdges()
  now   = int(time.time() * 1000)
  dateInitial = datetime.fromtimestamp(int(now/1000))
  timePeriod = findTimePeriod(dateInitial)
  print (edges)
  try:
    updates = checkThreshold(edges, now)
    print (updates)
    for patient in updates:
      # print (history[patient])
      hp = getPhoneNumberByName(patient)
      now1   = int(time.time() * 1000)
      # print (now1 - history[patient]['updatedAt'])
      dateNow = datetime.fromtimestamp(int(now1/1000))
      timePeriodNow = findTimePeriod(dateNow)
      # print (timePeriod, timePeriodNow)
      print (history[patient]['tags'])
      if history[patient]['tags'] != 'final':
        if (now1 - history[patient]['updatedAt'] > 10000):
          if history[patient]['1streading'] == 'normal': ## first reading is normal
            if ('successsms' not in history[patient].keys()) or ('successsms' in history[patient].keys() and history[patient]['successsms'] == False):
              print ("Sending sms..." + str(patient))
              messageBody = history[patient]["1stmessage"]
              print (history[patient]["1stmessage"] + str(patient))
              history[patient]['successsms'] = True
              print (messageBody)
              # message = client.messages.create(to=operatorNumber['Selman'], from_="Defu Dorm",
              #                          body=messageBody)
              # print (message.status)
              # message = client.messages.create(to=operatorNumber['Jermyn'], from_="Defu Dorm",
              #                          body=messageBody)
              # print (message.status)
              message = client.messages.create(to=hp, from_="Defu Dorm",
                                       body=messageBody)
              print (message.status)
      else:
        if history[patient]['1streading'] == 'normal': ## first reading is normal
          if ('successsms' not in history[patient].keys()) or ('successsms' in history[patient].keys() and history[patient]['successsms'] == False):
            print ("Sending sms..." + str(patient))
            messageBody = history[patient]["1stmessage"]
            print (history[patient]["1stmessage"] + str(patient))
            history[patient]['successsms'] = True
            print (messageBody)
            # message = client.messages.create(to=operatorNumber['Selman'], from_="Defu Dorm",
            #                            body=messageBody)
            # print (message.status)
            # message = client.messages.create(to=operatorNumber['Jermyn'], from_="Defu Dorm",
            #                          body=messageBody)
            # print (message.status)
            message = client.messages.create(to=hp, from_="Defu Dorm",
                                     body=messageBody)
            print (message.status)
        # if history[patient]['1streading'] == 'abnormal': ## first reading is abnormal
        #   if ('1stsms' not in history[patient].keys()) or ('1stsms' in history[patient].keys() and history[patient]['1stsms'] == False): ## send the first sms to take measuremnets in 30 mins later
        #     print ("Sending sms..." + str(patient))
        #     messageBody = companyHeader + "\n" + history[patient]["1stmessage"]
        #     messageOperatorBody = companyHeader + "\n" + history[patient]["1stOperatormessage"]
        #     print (companyHeader + "\n" + history[patient]["1stmessage"] + str(patient))
        #     print (companyHeader + "\n" + history[patient]["1stOperatormessage"] + str(patient))
        #     history[patient]['1stsms'] = True
        #     history[patient]['2ndsms'] = False
        #     history[patient]['1stsmsTime'] = int(time.time() * 1000)
            # message = client.messages.create(to=hp, from_="Defu Dorm",
            #                          body=messageBody)
            # message = client.messages.create(to=operatorNumber['Robin'], from_="Defu Dorm",
            #                          body=messageOperatorBody)
            # message = client.messages.create(to=operatorNumber['Saraa'], from_="Defu Dorm",
            #                          body=messageOperatorBody)
            # print (message.status)
          # elif history[patient]['2ndReading'] == None and (now1 - history[patient]['1stsmsTime'] >= DURATION_1H): ## send sms to retake measurement after 60 mins
          #   if '2ndsms' not in history[patient].keys() or ('2ndsms' in history[patient].keys() and history[patient]['2ndsms'] == False):
          #     print ("Send sms..." + str(patient))
          #     messageBody = companyHeader + "\n" + history[patient]["2ndmessage"]
          #     print (companyHeader + "\n" + history[patient]["2ndmessage"] + str(patient))
          #     history[patient]['2ndsms'] = True
          #     history[patient]['2ndsmsTime'] = int(time.time() * 1000)
              # message = client.messages.create(to=hp, from_="Defu Dorm",
              #                        body=messageBody)
              # print (message.status)
            # else:
            #   if 'operatormessage' in history[patient].keys() and ('operatorsms' not in history[patient].keys() or history[patient]['operatorsms'] == False):
            #     print ("Send sms..." + str(patient))
            #     messageOperatorBody = companyHeader + "\n" + history[patient]["operatormessage"]
            #     history[patient]['operatorsms'] = True
            #     print (companyHeader + "\n" + history[patient]["operatormessage"] + str(patient))
                # message = client.messages.create(to=operatorNumber['Robin'], from_="Defu Dorm",
                #                      body=messageOperatorBody)
                # message = client.messages.create(to=operatorNumber['Saraa'], from_="Defu Dorm",
                #                      body=messageOperatorBody)
                # print (message.status)
          # elif history[patient]['2ndReading'] == 'abnormal': ## 2nd reading is still abnormal
          #   if '2ndReadingsms' not in history[patient].keys() or ('2ndReadingsms' in history[patient].keys() and history[patient]['2ndReadingsms'] == False):
          #     print ("Send sms..." + str(patient))
          #     messageWorkerBody = companyHeader + "\n" + history[patient]["2ndabnormalmessage"]
          #     messageOperatorBody = companyHeader + "\n" + history[patient]["2ndOperatorabnormalmessage"]
          #     history[patient]['2ndReadingsms'] = True
          #     print (companyHeader + "\n" + history[patient]["2ndabnormalmessage"] + str(patient))
          #     print (companyHeader + "\n" + history[patient]["2ndOperatorabnormalmessage"] + str(patient))
              # message = client.messages.create(to=hp, from_="Defu Dorm",
              #                          body=messageWorkerBody)
              # message = client.messages.create(to=operatorNumber['Robin'], from_="Defu Dorm",
              #                        body=messageOperatorBody)
              # message = client.messages.create(to=operatorNumber['Saraa'], from_="Defu Dorm",
              #                        body=messageOperatorBody)
              # message = client.messages.create(to=operatorNumber['Mike'], from_="Defu Dorm",
              #                        body=messageOperatorBody)
              # message = client.messages.create(to=operatorNumber['Tushar'], from_="Defu Dorm",
              #                        body=messageOperatorBody)
              # print (message.status)
          # elif history[patient]['2ndReading'] == 'normal':  ## 2nd reading is normal
          #   if '2ndReadingsms' not in history[patient].keys() or ('2ndReadingsms' in history[patient].keys() and history[patient]['2ndReadingsms'] == False):
          #     print ("Send sms..." + str(patient))
          #     messageBody = companyHeader + "\n" + history[patient]["2ndnormalmessage"]
          #     messageOperatorBody = companyHeader + "\n" + history[patient]["2ndOperatornormalmessage"]
          #     history[patient]['2ndReadingsms'] = True
          #     print (companyHeader + "\n" + history[patient]["2ndnormalmessage"] + str(patient))
          #     print (companyHeader + "\n" + history[patient]["2ndOperatornormalmessage"] + str(patient))
              # message = client.messages.create(to=hp, from_="Defu Dorm",
              #                          body=messageBody)
              # message = client.messages.create(to=operatorNumber['Robin'], from_="Defu Dorm",
              #                        body=messageOperatorBody)
              # message = client.messages.create(to=operatorNumber['Saraa'], from_="Defu Dorm",
              #                        body=messageOperatorBody)
              # print (message.status)
  except:
    pass

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
    try:
      processEdges(interval)
    except:
      pass

####################################################################################
## BEGIN
####################################################################################

# update cache
# updateCache()

# # listen for cache notifications
# t1 = threading.Thread(target=listenForCacheUpdates)
# t1.setDaemon(True)
# t1.start()

# main loop
# schedule.every().day.at("23:" + str(morningTime+1)).do(getAllPatientsYetSubmit)
# schedule.every().day.at("23:" + str(morningTime+2)).do(getAllPatientsDidNotSubmit)
schedule.every().day.at("0" + str(morningTime) + ":00").do(reset)
# schedule.every().day.at("0" + str(morningTime+1) + ":00").do(getAllPatientsYetSubmit)
# schedule.every().day.at(str(afternoonTime-1) + ":59").do(getAllPatientsDidNotSubmit)
schedule.every().day.at(str(afternoonTime) + ":00").do(reset)
# schedule.every().day.at(str(afternoonTime+1) + ":00").do(getAllPatientsYetSubmit)
# schedule.every().day.at(str(eveningTime-1) + ":59").do(getAllPatientsDidNotSubmit)
schedule.every().day.at(str(eveningTime) + ":00").do(reset)
# schedule.every().day.at(str(eveningTime+1) + ":00").do(getAllPatientsYetSubmit)
# schedule.every().day.at(str(nightTime-1) + ":59").do(getAllPatientsDidNotSubmit)
schedule.every().day.at(str(nightTime) + ":00").do(reset)
# schedule.every().day.at(str(nightTime+1) + ":00").do(getAllPatientsYetSubmit)
# schedule.every().day.at("07:59").do(getAllPatientsDidNotSubmit)
main()