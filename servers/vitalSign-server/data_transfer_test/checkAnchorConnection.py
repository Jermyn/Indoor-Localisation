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
account = "AC2eb02ec5e40a8e34118104508f53b5d1"
token = "218d5a7806074a236ecedffa6eef7372"
client = Client(account, token)
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
anchors = {'b827eb2f5449':'rpi3', 'b827eb233b5d':'rpi5', 'b827eb69e503':'rpi6', 'b827eb4cc1bf':'rpi7'}
anchorslist = list(anchors.keys())
myhp = "+6591395832"
yenhp = "+6582335252"
johnhp = "+6592321181"

####################################################################################
## Methods
####################################################################################

def fetchFromES(es_database, timeStart, timeEnd):
  allAnchorsInRange = []
  search_body = {
    "size": 0,
    "query": {
      "bool": {
        "must": [
          {"type": {"value": "anchor-status"}}],
        "should": [
          {"term": {"anchorId": "b827eb2f5449"}},
          {"term": {"anchorId": "b827eb233b5d"}},
          {"term": {"anchorId": "b827eb69e503"}},
          {"term": {"anchorId": "b827eb4cc1bf"}}
        ], 
        "minimum_should_match": 1, 
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
          "size": 4,
          "field": "anchorId.keyword"
        }
      }
    }
  }


  resp = es_database.search(
        index = "zmq",
        body = search_body,
  )
  allAnchors = resp["aggregations"]["group_by_device_id"]["buckets"]
  for anchor in allAnchors:
    allAnchorsInRange.append(anchor["key"])
  return allAnchorsInRange

def getRoomByAnchor(anchorid):
  global db
  rooms = db.child("rooms").get()
  for key, room in rooms.val().items():
    try:
      if str(room["anchors"][0]["uuid"]) == str(anchorid):
        return room["name"]
    except:
      continue

def checkAnchorDisconnect():
  global es_conn
  startTime = datetime.fromtimestamp(time.time() - 1800)
  endTime = datetime.fromtimestamp(time.time())
  count = 0
  roomNum = ""
  print ("fetching from es...")
  print (startTime, endTime)
  allAnchorsInRange = fetchFromES(es_conn, startTime, endTime)
  for anchor in anchorslist:
    if anchor not in allAnchorsInRange:
      roomNum = getRoomByAnchor(anchor)
      count += 1
      print ("sending sms...")
      messageBody = str(anchors[anchor]) + " in " + str(roomNum) + " went offline. Please help to check if it is powered on."

      message = client.messages.create(to=myhp, from_="Defu Dorm",
                                     body=messageBody)
      print (message.status)
      
      message = client.messages.create(to=yenhp, from_="Defu Dorm",
                                     body=messageBody)
      print (message.status)
      
      message = client.messages.create(to=johnhp, from_="Defu Dorm",
                                     body=messageBody)
      print (message.status)
    else:
      print (str(anchors[anchor]) + " in " + str(roomNum) + " is connected...")
  # if count == 0:
  #   print ("All anchors are connected...")


####################################################################################
## SCHEDULES
####################################################################################

schedule.every(30).minutes.do(checkAnchorDisconnect)

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
