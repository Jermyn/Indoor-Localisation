from elasticsearch import Elasticsearch
from datetime import datetime, timedelta
import time
from collections import defaultdict, Counter
import functools, operator
import zmq
from statistics import mean
import json

HOST_URLS = ["http://127.0.0.1:9200"]
es_conn = Elasticsearch(HOST_URLS)
DURATION_1D = 86400000
config  = None
with open('./config.json', 'r') as f:
  config = json.load(f)
morningTime = 6
afternoonTime = 12
eveningTime = 16
nightTime = 20

averageDataPort = zmq.Context().socket(zmq.PUSH);
# averageData.setsockopt(zmq.ZMQ_SNDHWM, 2000);
averageDataPort.connect(config['zmqSockets']['average']['pushpull']);

def retrieve3DaysData(es_database, startTime, endTime, devices):
  ##edit the query size
  fullData = []
  search_body = {
       "size": 10000,
    "sort": [{"@timestamp": {"order": "asc"}}],
    "query": {
      "bool": {
        "must": 
          {"term": {"gattid": devices}},
        "filter": [
          {"type" : { "value" : "vitals" } },
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
    }
  }
  resp = es_database.search(
        index = "zmq",    
        body = search_body,
        scroll = '3m', # time value for search
    )
  temp = resp["hits"]["hits"]
  # print (temp)
  fullData.append(temp)
  temp = []
  scroll_id = resp['_scroll_id']
  fullData = doScroll(es_database, fullData, scroll_id)
  return fullData

def retrieve3DaysAvgData(es_database, startTime, endTime, devices):
  ##edit the query size
  fullAvg = []
  search_body = {
   "size": 10000,
    "sort": [{"@timestamp": {"order": "asc"}}],
    "query": {
      "bool": {
        "must": 
          {"term": {"gattid": devices}},
        "filter": [
          {"type" : { "value" : "average" } },
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
    }
  }
  resp = es_database.search(
        index = "zmq",
        body = search_body,
        scroll = '3m', # time value for search
    )
  temp = resp["hits"]["hits"]
  # print ("average")
  # print (temp)
  fullAvg.append(temp)
  scroll_id = resp['_scroll_id']
  fullAvg = doScroll(es_database, fullAvg, scroll_id)
  return fullAvg

def doScroll(es_database, fullData, scroll_id):
  resp = es_database.scroll(
        scroll_id = scroll_id,
        scroll = '1m', # time value for search
    )

  print ('scroll() query length:', len(resp))
  temp = resp["hits"]["hits"]
  # print (temp)
  fullData.append(temp)
  temp = []
  scroll_id = resp['_scroll_id']
  scroll_size = len(resp["hits"]["hits"])
  if scroll_size > 0:
    doScroll(es_database, fullData, scroll_id)
  # else:
  #   if (len(fullData) > 0):
  #     print (fullData)
  #     print (len(fullData[0][0].items()))
  return fullData[0]

def appendList(data, time, hrIndex, spo2Index, datalist):
  global morningTime, afternoonTime, eveningTime, nightTime
  temp = []
  if (time.hour > morningTime and time.hour < afternoonTime) or (time.hour == afternoonTime and (time.minute == 0 and time.second == 0)):
    temp.append(data["_source"][hrIndex])
    temp.append(data["_source"][spo2Index])
    temp.append(time)
    datalist[str(time.day)]['morning'].append(temp)
    temp = []
    
  elif (time.hour > afternoonTime and time.hour < eveningTime) or (time.hour == afternoonTime and (time.minute > 0 and time.second > 0)) or (time.hour == eveningTime and (time.minute == 0 and time.second == 0)):
    temp.append(data["_source"][hrIndex])
    temp.append(data["_source"][spo2Index])
    temp.append(time)
    datalist[str(time.day)]['afternoon'].append(temp)
    temp = []
   
  elif (time.hour > eveningTime and time.hour < nightTime) or (time.hour == eveningTime and (time.minute > 0 and time.second > 0)) or (time.hour == nightTime and (time.minute == 0 and time.second == 0)):
    temp.append(data["_source"][hrIndex])
    temp.append(data["_source"][spo2Index])
    temp.append(time)
    datalist[str(time.day)]['evening'].append(temp)
    temp = []
  return datalist

def calculateCurrentAverage(Avg_hr, Avg_spo2, datalist, elements, index, day, period, avglist):
  # print (avglist[day][period])
  # print (elements, index)
  # print (Avg_hr[day][period])
  if len(avglist[day][period]) == 0: ### check for no averages computed
    if len(datalist[day][period]) == 1: ### just assign the avg with the only data in the list
      # print ("1")
      Avg_hr[day][period] = elements[0]
      Avg_spo2[day][period] = elements[1]
    elif len(datalist[day][period]) > 1:
      # print ("2")
      if Avg_hr[day][period] == []: ###assigning the avg_hr and avg_spo2 with first element
        # print ("3")
        Avg_hr[day][period] = elements[0]
        Avg_spo2[day][period] = elements[1]
      if Avg_hr[day][period] != []:
        # print ("4")
        average_hr = (index * Avg_hr[day][period] + elements[0]) / (index+1)
        average_sp02 = (index * Avg_spo2[day][period] + elements[1]) / (index+1)
        Avg_hr[day][period] = average_hr
        Avg_spo2[day][period] = average_sp02
  else: ###averages existed
    if Avg_hr[day][period] == []: ###assigning the avg_hr and avg_spo2 with last average data
      # print ("5")
      Avg_hr[day][period] = avglist[day][period][len(avglist[day][period])-1][0]
      Avg_spo2[day][period] = avglist[day][period][len(avglist[day][period])-1][1]
    if Avg_hr[day][period] != []:
      # print ("6")
      average_hr = (index * Avg_hr[day][period] + elements[0]) / (index+1)
      average_sp02 = (index * Avg_spo2[day][period] + elements[1]) / (index+1)
      Avg_hr[day][period] = average_hr
      Avg_spo2[day][period] = average_sp02
  return Avg_hr, Avg_spo2

def calculateAverage(Avg_hr, Avg_spo2, datalist, elements, index, day, period, avglist):
  temp = []
  if len(datalist[day][period]) == 1: ### just assign the avg with the only data in the list
    print (day, period)
    print ("1")
    Avg_hr[day][period] = elements[0]
    Avg_spo2[day][period] = elements[1]
  elif len(datalist[day][period]) > 1:
    print (day, period)
    print ("2")
    if len(Avg_hr[day][period]) == 0 or Avg_hr[day][period] != None: ###assigning the avg_hr and avg_spo2 with first element
      print (day, period)
      print ("3")
      Avg_hr[day][period] = elements[0]
      Avg_spo2[day][period] = elements[1]
    if Avg_hr[day][period] != []:
      print (day, period)
      print ("4")
      average_hr = (index * Avg_hr[day][period] + elements[0]) / (index+1)
      average_sp02 = (index * Avg_spo2[day][period] + elements[1]) / (index+1)
      Avg_hr[day][period] = average_hr
      Avg_spo2[day][period] = average_sp02
  return Avg_hr, Avg_spo2

def averageAlgo(datalist, avglist, device, timePeriod):
  Avg_hr = defaultdict(lambda: defaultdict(list))
  Avg_spo2 = defaultdict(lambda: defaultdict(list))
  periodState = ['morning', 'afternoon', 'evening']
  for day, items in datalist.items():
    for period, data in datalist[day].items():
      for index, elements in enumerate(datalist[day][period]):
        ### check if its the past period
        if (int(day) < timePeriod[0]) or (int(day) == timePeriod[0] and periodState.index(period) < periodState.index(timePeriod[1])):
          if len(avglist[day][period]) == 0: ### no averages computed yet
            print ("-----------Past time period with no averages computed already----------")
            Avg_hr, Avg_spo2 = calculateAverage(Avg_hr, Avg_spo2, datalist, elements, index, day, period, avglist)
            sendData = json.dumps({
              'gattid': device,
              'time': int(datetime.timestamp(elements[2])*1000),
              'period': [day, period],
              'average_hr': float("{0:.2f}".format(float(Avg_hr[day][period]))),
              'average_spO2': float("{0:.2f}".format(float(Avg_spo2[day][period])))
            })
            averageDataPort.send_string(sendData)
            print ("Sending...", sendData)
          else: ###averages already computed
            print ("-----------Past time period with averages computed already----------")
            continue
        else: ###current time period
          if len(avglist[day][period]) == 0: ###check if averages are computed
            print ("-----------current time period with no averages not yet computed already----------")
            Avg_hr, Avg_spo2 = calculateCurrentAverage(Avg_hr, Avg_spo2, datalist, elements, index, day, period, avglist)
            sendData = json.dumps({
              "gattid": device,
              "time": int(datetime.timestamp(elements[2])*1000),
              "period": [day, period],
              "average_hr": float("{0:.2f}".format(float(Avg_hr[day][period]))),
              "average_spO2": float("{0:.2f}".format(float(Avg_spo2[day][period])))
            })
            averageDataPort.send_string(sendData)
            print ("Sending...", sendData)
          else:
            if (elements[2] > avglist[day][period][len(avglist[day][period])-1][2]):
              print ("-----------current time period with averages not yet computed already----------")
              Avg_hr, Avg_spo2 = calculateCurrentAverage(Avg_hr, Avg_spo2, datalist, elements, index, day, period, avglist)
              sendData = json.dumps({
                "gattid": device,
                "time": int(datetime.timestamp(elements[2])*1000),
                "period": [day, period],
                "average_hr": float("{0:.2f}".format(float(Avg_hr[day][period]))),
                "average_spO2": float("{0:.2f}".format(float(Avg_spo2[day][period])))
              })
              averageDataPort.send_string(sendData)
              print ("Sending...", sendData)
          


def findTimePeriod(dateNow):
  global morningTime, afternoonTime, eveningTime, nightTime
  if (dateNow.hour > morningTime and dateNow.hour < afternoonTime) or (dateNow.hour == afternoonTime and (dateNow.minute == 0 and dateNow.second == 0)):
    return [dateNow.day, 'morning']
  elif (dateNow.hour > afternoonTime and dateNow.hour < eveningTime) or (dateNow.hour == afternoonTime and (dateNow.minute > 0 and dateNow.second > 0)) or (dateNow.hour == eveningTime and (dateNow.minute == 0 and dateNow.second == 0)):
    return [dateNow.day, 'afternoon']
  elif (dateNow.hour > eveningTime and dateNow.hour < nightTime) or (dateNow.hour == eveningTime and (dateNow.minute > 0 and dateNow.second > 0)) or (dateNow.hour == nightTime and (dateNow.minute == 0 and dateNow.second == 0)):
    return [dateNow.day, 'evening']


def startAverage(fullData, fullAvg, device, dateNow):
  readinglist, avglist = defaultdict(lambda: defaultdict(list)), defaultdict(lambda: defaultdict(list))
  for data in fullData:
    time = datetime.strptime(data["_source"]["@timestamp"], "%Y-%m-%dT%H:%M:%S.%fZ") + timedelta(hours=8)
    readinglist = appendList(data, time, "heart_rate", "spo2", readinglist)
  if fullAvg != []:
    for avg in fullAvg:
      time = datetime.strptime(avg["_source"]["@timestamp"], "%Y-%m-%dT%H:%M:%S.%fZ") + timedelta(hours=8)
      avglist = appendList(avg, time, "average_hr", "average_spO2", avglist)
  timePeriod = findTimePeriod(dateNow)
  averageAlgo(readinglist, avglist, device, timePeriod)


def main():
  while True:
    time.sleep(0.5)
    try:
      now   = int(time.time() * 1000)
      startTime = datetime.fromtimestamp((now - (DURATION_1D*2))/1000).strftime("%Y-%m-%dT%H:%M")
      endTime = datetime.fromtimestamp((now + DURATION_1D)/1000).strftime("%Y-%m-%dT%H:%M")
      dateNow = datetime.fromtimestamp(int(now/1000))
      data = retrieve3DaysData(es_conn, startTime, endTime, 'f32d732ef72c')
      averageData = retrieve3DaysAvgData(es_conn, startTime, endTime, 'f32d732ef72c')
      startAverage(data, averageData, 'f32d732ef72c', dateNow)
    except:
      raise
main()