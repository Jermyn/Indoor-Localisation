from elasticsearch import Elasticsearch
import time
from datetime import datetime, timedelta
from storeScale import getAnchors
import requests, sys, json

####################################################################################
## State
####################################################################################

HOST_URLS = ["http://52.77.184.100:9200"]
es_conn = Elasticsearch(HOST_URLS)
# es_conn = Elasticsearch(
#   HOST_URLS,
#   http_auth=('elastic', 'kibana'),
#   scheme="http",
#   port=9200,
# )
headers = {
    'Content-Type': 'application/json',
}
cache_anchors = getAnchors('Walkway_to_B')
pssh_hosts_file = open('pssh_hosts', 'w')

####################################################################################
## Methods
####################################################################################

def convertFromMAC(receiverId):
  for anchor, data in cache_anchors.items():
    if data['device']['id'] == receiverId:
      return anchor
  return False

def fetchFromES(es_database, startTime, endTime, filterTerms):
  allAnchorsInRange = {}
  search_body = json.dumps({
    "size": 0,
    "query": {
      "bool": {
        "should": filterTerms,
        "minimum_should_match": 1,
        "filter": [
        {
         "range": {
           "@timestamp": {
             "gte": startTime,
             "lte": endTime,
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
          "size": 7,
          "field": "hostname.keyword"
        },
        "aggs": {
          "aggs_latest": {
            "top_hits": {
              "_source": ["syslog.ip"],
              "size": 1
            }
          }
        }
      }
    }
  })

  response = requests.post('http://52.77.184.100:9200/anchor_status/_search/', headers=headers, data=search_body)
  resp = response.json()
  print(resp)
  allAnchors = resp["aggregations"]["group_by_device_id"]["buckets"]
  for anchor in allAnchors:
    # allAnchorsInRange = {anchor["key"] : {}}
    allAnchorsInRange[anchor["key"].replace("\n", "")] = {"ip": anchor['aggs_latest']['hits']['hits'][0]['_source']['syslog']['ip'].replace(" \n", "")}
    # allAnchorsInRange.append(anchor["key"])
  return allAnchorsInRange

def setUpFilterTerms(deviceList):
  argumentList = []
  oneDeviceDict = {}
  for device in deviceList:
    oneDeviceDict = { "term": { "hostname": str(device) } }
    argumentList.append(oneDeviceDict)
  return argumentList

def writeToFile(fileName, data):
  try:
    keys = list(data.keys())
    for device, val in data.items():
      ip = val['ip']
      if device != keys[-1]:
        fileName.write(ip + "\n")
      else:
        fileName.write(ip)
    print("Write to file successful")
  except TypeError as err: print ("There have been an error", err)


def checkAnchorConnected():
  global es_conn
  deviceList = sys.argv[1:len(sys.argv)]
  # startTime = "2022-02-28T12:00"
  # endTime = "2022-02-28T15:00"
  startTime = datetime.strftime(datetime.fromtimestamp(time.time() - 1800), '%Y-%m-%dT%H:%M:%S')
  endTime = datetime.strftime(datetime.fromtimestamp(time.time()), '%Y-%m-%dT%H:%M:%S')
  print ("fetching from es...")
  argumentList = setUpFilterTerms(deviceList)
  # print (argumentList)
  allAnchorsInRange = fetchFromES(es_conn, startTime, endTime, argumentList)
  print (allAnchorsInRange)
  return allAnchorsInRange

allAnchorsInRange = checkAnchorConnected()
writeToFile(pssh_hosts_file, allAnchorsInRange)

