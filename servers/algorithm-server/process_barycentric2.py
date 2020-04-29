import json
import redis
import zmq
import time
import copy
import threading
import numpy as np
from collections import defaultdict
from barycentric import barycentric
from rssi import rssiToDistance, rssiToDistanceVariance
from cache import getCache
from aggregate import getEdges
from pprint import PrettyPrinter
from datetime import datetime
import csv
import operator
import pdb
import base64

import urllib.request, json
import binascii 
import struct
import math

from bokeh.io import curdoc
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show, output_file
from bokeh.layouts import row, column, gridplot
from bokeh.models.widgets import PreText,Select, Button
from bokeh.resources import INLINE
from collections import deque

pp = PrettyPrinter(indent=2)
edges = defaultdict(lambda: {})

dataQueue = deque()
timeQueue = deque()
dataHomeList = []

dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp,sysTime")

uuid=[]
charac=[]
ct=0
ctHR=0
previousSequenceNumber = None
previousTimeStamp = None
initialTime =0
endTime =0
timeDuration=0
flag=1
currentUUID=""
currentCharac=""
currentMode=0

homeFile = open("home.csv", "a") 

####################################################################################
## BOKEH
####################################################################################

# homeFile = open("01_Home.csv", "a") 

uuid.append('-')
charac.append('-')

sourceAx = ColumnDataSource(dict(x=[],y=[]))
sourceAy = ColumnDataSource(dict(x=[],y=[]))
sourceAz = ColumnDataSource(dict(x=[],y=[]))

sourceMx = ColumnDataSource(dict(x=[],y=[]))
sourceMy = ColumnDataSource(dict(x=[],y=[]))
sourceMz = ColumnDataSource(dict(x=[],y=[]))

sourceGx = ColumnDataSource(dict(x=[],y=[]))
sourceGy = ColumnDataSource(dict(x=[],y=[]))
sourceGz = ColumnDataSource(dict(x=[],y=[]))

sourceHR = ColumnDataSource(dict(x=[],y=[]))

source0 = ColumnDataSource(dict(x=[],y=[]))
source1 = ColumnDataSource(dict(x=[],y=[]))
source2 = ColumnDataSource(dict(x=[],y=[]))
source3 = ColumnDataSource(dict(x=[],y=[]))

source4 = ColumnDataSource(dict(x=[],y=[]))

fig=figure(plot_width=700, plot_height=400, title="Acceleration")
fig.line(source=sourceAx, x='x', y='y', line_width=2, alpha=.85, color='red')
fig.line(source=sourceAy, x='x', y='y', line_width=2, alpha=.65, color='blue')
fig.line(source=sourceAz, x='x', y='y', line_width=2, alpha=.45, color="green")
fig.line(source=sourceMx, x='x', y='y', line_width=2, alpha=.85, color='blue')
fig.line(source=sourceMy, x='x', y='y', line_width=2, alpha=.65, color='blue')
fig.line(source=sourceMz, x='x', y='y', line_width=2, alpha=.45, color='blue')
fig.line(source=sourceGx, x='x', y='y', line_width=2, alpha=.85, color='green')
fig.line(source=sourceGy, x='x', y='y', line_width=2, alpha=.65, color='green')
fig.line(source=sourceGz, x='x', y='y', line_width=2, alpha=.45, color='green')

figH=figure(plot_width=700, plot_height=400, title="Heart Rate")
figH.line(source=sourceHR, x='x', y='y', line_width=2, alpha=.85, color='red')

fig0=figure(plot_width=700, plot_height=400, title="ECG 1")
fig0.line(source=source0, x='x', y='y', line_width=2, alpha=.85, color='red')

fig1=figure(plot_width=700, plot_height=400, title="ECG 2")
fig1.line(source=source1, x='x', y='y', line_width=2, alpha=.85, color='red')

fig2=figure(plot_width=700, plot_height=400, title="Respiration 1")
fig2.line(source=source2, x='x', y='y', line_width=2, alpha=.85, color='blue')

fig3=figure(plot_width=700, plot_height=400, title="Respiration 2")
fig3.line(source=source3, x='x', y='y', line_width=2, alpha=.85, color='blue')

fig4=figure(plot_width=700, plot_height=400, title="heart beat")
fig4.line(source=source4, x='x', y='y', line_width=2, alpha=.85, color='blue')

####################################################################################
## REDIS, ZMQ
####################################################################################

config  = None
with open('../config.json', 'r') as f:
  config = json.load(f)

r = redis.Redis(charset="utf-8", decode_responses=True)

notifications = zmq.Context().socket(zmq.SUB)
notifications.setsockopt_string(zmq.SUBSCRIBE, config['notifications']['cacheUpdate'])
notifications.connect(config['zmqSockets']['broker']['xpub'])

notify = zmq.Context().socket(zmq.PUB)
notify.connect(config['zmqSockets']['broker']['xsub'])

#requests = zmq.Context().socket(zmq.REQ)
#requests.connect(config['zmqSockets']['serverRequests']['reqrep'])

####################################################################################
## State
####################################################################################

cacheBC         = {}
cacheBokeh      = getCache()
history       = defaultdict(lambda: {})

####################################################################################
## UTILITIES
####################################################################################

def redisHashZsetToDict(name, members):
  if members:
    return { m: r.hgetall(name + ':' + m) for m in members}
  else:
    return { m: r.hgetall(name + ':' + m) for m in r.zrange(name, 0, -1)}

def redisHashSetToDict(name):
  return { m: r.hgetall(name + ':' + m) for m in r.smembers(name) }

def updateCacheBC():
  global cacheBC
  cacheBC = getCache()  
  print('loaded cache version for BC is', cacheBC['version'])
  # requests.send_string(config['notifications']['cacheRequest'])
  # cache = requests.recv_json()
  # if cache and 'version' in cache:
    # print('loaded cache version', cache['version'])

def updateCacheBokeh():
  requests = zmq.Context().socket(zmq.REQ)
  requests.connect('tcp://137.132.165.139:5570')
  global cacheBokeh
  requests.send_string("CACHE_REQUEST")
  cacheBokeh = requests.recv_json()
  if cacheBokeh and 'version' in cacheBokeh:
    print('loaded cache version for Bokeh is', cacheBokeh['version'])
updateCacheBokeh()    

for gatt in cacheBokeh['gatts']:
    uuid.append(gatt)
    for key in cacheBokeh['gatts'][gatt]['profile'].keys():
        for character in cacheBokeh['gatts'][gatt]['profile'][key].keys():
            if character not in charac:
                charac.append(character)

####################################################################################
## Methods
####################################################################################

rssiDataList=[]
beaconDataList=[]
beaconDev = 'ecg0'
# sysStartTime=datetime.strptime("2017-08-10 14.56.56.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysEndTime=datetime.strptime("2017-08-10 15.15.25.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
sysStartTime=datetime.strptime("2017-08-11 14.57.04.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
sysEndTime=datetime.strptime("2017-08-11 15.14.49.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000


####################################################################################
## BOKEH METHODS
####################################################################################
def uuidChanged(attr,old,new):
    global currentUUID, currentCharac
    currentUUID=new
    print(new)

def characChanged(attr,old,new):
    global currentUUID, currentCharac
    currentCharac=new
    print(new)

def durationChanged(attr,old,new):
    global timeDuration
    timeDuration=new
    print("Time: " + new)

def buttonClicked():
    global flag, initialTime, endTime, currentMode, button, dataHomeList, dataEcgList, dataHrList
    if flag==1:
        button.button_type="warning"
        button.label="Collecting..."
        flag=0
        initialTime=0
        endTime=0
        print("Start Collecting Data") 
    else:
        button.button_type="success"
        button.label="Collect Data"
        # flag=1
        initialTime=0
        endTime=0
        currentMode=0
        print("Stop Collecting Data")


ticker1 = Select(value='-', options=uuid, title="UUID")
ticker2 = Select(value='-', options=charac, title="Characteristic")
ticker1.on_change("value", uuidChanged)
ticker2.on_change("value", characChanged)

button = Button(label="Collect Data", button_type="success")
button.on_click(buttonClicked)

duration = Select(value='-', options=['-','1','2','3','4','5','6','7','8','9','10','20','30','120'], title="Collection time")
duration.on_change("value", durationChanged)

def endProcess():
    global initialTime, endTime, flag, currentMode, button, homeFile, dataHomeList
    global done

    print("Process Ended")

    # totalPack=(endTime-initialTime)*1000/time
    # receivePack = len(dataList)
    # efficiency = receivePack / totalPack * 100
    # print("Efficiency: " + str(efficiency))

    # initialTime=0

    write_file =str("home" + str(int(time.time())) + ".csv")
    with open(write_file, "w") as output:
        for line in dataHomeList:
            output.write(line + '\n')
    dataHomeList=[]
    print("Saved to Home file")

    # dataEcgList.append("ecg1Sample1,ecg1Sample2,ecg2Sample1,ecg2Sample2,ResRate1Sample1,ResRate1Sample2,ResRate2Sample1,ResRate2Sample2,timeStamp,sysTime, timeQueue")
    dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp,sysTime")
    # dataHrList.append("hr,timeStamp,sysTime")

    initialTime=0
    currentMode=0
    

filter_taps= ([
    0.000000,-0.000001,-0.000002,-0.000005,-0.000009,-0.000015,-0.000022,-0.000032,-0.000044,-0.000058,-0.000075,-0.000094,-0.000115,
    -0.000138,-0.000160,-0.000183,-0.000204,-0.000221,-0.000234,-0.000240,-0.000236,-0.000221,-0.000193,-0.000148,-0.000084,0.000000,
    0.000107,0.000237,0.000393,0.000573,0.000778,0.001005,0.001253,0.001517,0.001793,0.002075,0.002355,0.002625,0.002875,0.003095,
    0.003273,0.003396,0.003452,0.003428,0.003311,0.003088,0.002747,0.002276,0.001667,0.000910,-0.000000,-0.001067,-0.002293,-0.003676,
    -0.005212,-0.006893,-0.008710,-0.010648,-0.012693,-0.014823,-0.017019,-0.019255,-0.021507,-0.023746,-0.025945,-0.028075,-0.030108,
    -0.032015,-0.033770,-0.035347,-0.036723,-0.037879,-0.038796,-0.039462,-0.039865,0.960000,-0.039865,-0.039462,-0.038796,-0.037879,
    -0.036723,-0.035347,-0.033770,-0.032015,-0.030108,-0.028075,-0.025945,-0.023746,-0.021507,-0.019255,-0.017019,-0.014823,-0.012693,
    -0.010648,-0.008710,-0.006893,-0.005212,-0.003676,-0.002293,-0.001067,-0.000000,0.000910,0.001667,0.002276,0.002747,0.003088,
    0.003311,0.003428,0.003452,0.003396,0.003273,0.003095,0.002875,0.002625, 0.002355, 0.002075, 0.001793, 0.001517, 0.001253, 
    0.001005,0.000778,0.000573,0.000393,0.000237,0.000107,0.000000,-0.000084,-0.000148,-0.000193,-0.000221,-0.000236,-0.000240, 
    -0.000234,-0.000221,-0.000204,-0.000183,-0.000160,-0.000138,-0.000115,-0.000094,-0.000075,-0.000058,-0.000044,-0.000032,-0.000022, 
    -0.000015,-0.000009,-0.000005,-0.000002,-0.000001,0.000000
])


heartRate=[]
time10s=(int(time.time())*1000)+10000
beat=0
timer = 0
count = 0
hpf = []
hpfr = []



################################
## HOME REHAB
################################

def homeRehab(x):
    global initialTime, endTime, dataHomeList, timeDuration, currentMode
    x = requests.recv_json()
    d = base64.b64decode(x['data']) #x['data'].decode('base64')
    data=bytearray(d)
    ts0 = data[2] & 0x0f;
    ts1 = data[4] & 0x0f;
    ts2 = data[6] & 0x0f;
    ts3 = (data[8] & 0xf0) >> 4;
    ts4 = (data[10] & 0xf0) >> 4;
    ts5 = (data[12] & 0xf0) >> 4;
    timestamp = ts0 | (ts1<<4) | (ts2 <<8) | (ts3 << 12) | (ts4 << 16) | (ts5 << 20);
    
    ax = (data[2] & 0xf0) | (data[3] << 8);
    ay = (data[4] & 0xf0) | (data[5] << 8);
    az = (data[6] & 0xf0) | (data[7] << 8);
    accX =(ax + 2**15) % 2**16 - 2**15
    accY =(ay + 2**15) % 2**16 - 2**15
    accZ =(az + 2**15) % 2**16 - 2**15
    
    mx = ((data[8] & 0x0f)<<8 | data[9])<<4
    my = ((data[10] & 0x0f)<<8 | data[11])<<4
    mz = ((data[12] & 0x0f)<<8 | data[13])<<4
    magX =(mx + 2**15) % 2**16 - 2**15
    magY =(my + 2**15) % 2**16 - 2**15
    magZ =(mz + 2**15) % 2**16 - 2**15
    
    gx = data[14]<<8 | data[15]
    gy = data[16]<<8 | data[17]
    gz = data[18]<<8 | data[19]
    gyroX =(gx + 2**15) % 2**16 - 2**15
    gyroY =(gy + 2**15) % 2**16 - 2**15
    gyroZ =(gz + 2**15) % 2**16 - 2**15
    
    new_dataAx = dict(x=[timestamp],y=[accX])
    sourceAx.stream(new_dataAx,100)
    new_dataAy = dict(x=[timestamp],y=[accY])
    sourceAy.stream(new_dataAy,100)
    new_dataAz = dict(x=[timestamp],y=[accZ])
    sourceAz.stream(new_dataAz,100)

    pdb.set_trace()
    print("HOME REHAB")

    # new_dataMx = dict(x=[timestamp],y=[magX])
    # sourceMx.stream(new_dataMx,100)
    # new_dataMy = dict(x=[timestamp],y=[magY])
    # sourceMy.stream(new_dataMy,100)
    # new_dataMz = dict(x=[timestamp],y=[magZ])
    # sourceMz.stream(new_dataMz,100)
    
    # new_dataGx = dict(x=[timestamp],y=[gyroX])
    # sourceGx.stream(new_dataGx,100)
    # new_dataGy = dict(x=[timestamp],y=[gyroY])
    # sourceGy.stream(new_dataGy,100)
    # new_dataGz = dict(x=[timestamp],y=[gyroZ])
    # sourceGz.stream(new_dataGz,100)

    if flag==0:
        if initialTime !=0:
            # dataHomeList=[]
            # currentMode=2
            # initialTime=int(time.time())
            # endTime = initialTime + (int(timeDuration)*60)
            # dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp")
            # print("start")
        # else:
            dataHomeList.append(str(accX) + "," + str(accY) + "," + str(accZ) + "," + str(magX) + "," + str(magY) + "," + str(magZ) + "," + str(gyroX) + "," + str(gyroY) + "," + str(gyroZ) + "," + str(timestamp) + "," + str(int(time.time()*1000)))
            # if timestamp>endTime:
            #     endProcess("homeOutput_" + str(time.time()) + ".csv", dataHomeList,20)

def augmentGraph(edges, interval):
  # augment info
  rems = []
  for t in edges:
    for r in edges[t]:
      try:
        measuredPower = float(cacheBC['devices'][t]['beacon']['measuredPower'])
        rssi          = float(edges[t][r]['mu'])
        sigma         = float(edges[t][r]['sigma'])
        period        = float(edges[t][r]['period'])
        location      = cacheBC['devices'][r]['location']
        sigmaDistance = rssiToDistanceVariance(rssi, sigma, measuredPower)
        distance      = rssiToDistance(rssi, measuredPower)
        scale         = location['map']['scale']
        sigmaRadians  = sigmaDistance / scale**2
        edges[t][r] = {
          'measuredPower': measuredPower,
          'rssi': rssi,
          'sigma': sigma,
          'numObservations': interval / period,
          'location': location,
          'distance': distance,
          'sigmaDistance': sigmaDistance,
          'radians': distance / scale,
          'sigmaRadians': sigmaRadians
        }
      except:
        rems.append((t,r))
        continue

  # remove malformed edges
  for (t, r) in rems:
    del edges[t][r]

  # get edges not in the same map as closest
  rems = []
  for t, info in edges.items():
    try:
      if info:
        closest   = sorted(info.keys(), key=lambda r: info[r]['distance'])[0]
        location  = info[closest]['location']
        for r in info:
          if info[r]['location']['map']['id'] != location['map']['id']:
            rems.append((t,r))
    except:
      continue

  # remove receivers not in the same map as the closest
  for (t, r) in rems:
    del edges[t][r]

  # return augmented edges
  return edges

def transmitterGraph(edges):
  d = defaultdict(lambda: {})
  for k, v in edges.items():
    receiverId      = v['receiverId']
    transmitterId   = v['transmitterId']
    beaconId        = cacheBC['device'][transmitterId]['beaconId']
    measuredPower   = float(cacheBC['beacon'][beaconId]['measuredPower'])
    rssi            = float(v['mu'])
    mapId           = cacheBC['device'][receiverId]['mapId']
    scale           = float(cacheBC['map'][mapId]['scale']) 
    distance        = rssiToDistance(rssi, measuredPower)
    # make dictionary
    d[transmitterId][receiverId] = {
      'distance': distance,
      'radians':  distance / scale,
      'scale':    scale,
      'lat':      float(cacheBC['device'][receiverId]['lat']),
      'lng':      float(cacheBC['device'][receiverId]['lng']),
      'mapId':    mapId
    }
  # remove nodes which are not in the same map as the closest node
  remove = set()
  for t in d.keys():
    closest = sorted(d[t].keys(), key=lambda x: d[t][x]['distance'])[0]
    mapId   = d[t][closest]['mapId']
    for r, v in d[t].items():
      if v['mapId'] != mapId:
        remove.add((t,r))
  # delete entries
  for (t, r) in remove:
    del d[t][r]
  return d

def calculateLocation(n, nbrsInfo):
  nbrs  = list(nbrsInfo.keys())
  _map        = nbrsInfo[nbrs[0]]['location']['map']
  pos   = barycentric(
    n,
    nbrs,
    nbrsInfo
  )
  return {
    'map': _map,
    'latLng': pos,
    'lat': pos[1,0],
    'lng': pos[0,0]
  }

# def searchCacheDevices(deviceId):
#   i=0
#   while i< len(cache['devices']):
#     #print(len(cacheBC['devices']))
#     #print(cacheBC['devices'][i])
#     #print(cacheBC['devices'][i]['id'])
#     if(cache['devices'][i]['id']==deviceId):
#       return cache['devices'][i]['type'] 
#     i+=1

def transmitterLocations(transmitters):
  return { t: calculateLocation(t, info) \
    for t, info in transmitters.items() \
    #if searchCacheDevices(t) == 'mobile' and info
    if cacheBC['devices'][t]['type'] == 'mobile' and info}

def distance(a, b, scale):
  return scale * np.linalg.norm(a - b)

def updateLocations(locations, delta):
  global history
  updates = set()
  for deviceId, location in locations.items():
    _map = location['map']
     # create if not exist
    if (deviceId not in history) or \
    (deviceId in history and \
    distance(location['latLng'], history[deviceId]['location']['latLng'], _map['scale']) > delta):
      updates.add(deviceId)
    # update history
    history[deviceId].update({
      'location': {
        'map': _map,
        'latLng': location['latLng'],
        'lat': location['lat'],
        'lng': location['lng']
      }
    })
  return updates

# def getEdges():
#   global edges
#   return copy.deepcopy(edges)

def writeToFile(rawData):
  data = rawData

  # write_file = str("ecg0_location_X2_barycentric.csv")
  write_file = str("testfile.csv")
  with open(write_file, "w") as output:
    for line in data:
      output.write(line + '\n')

  print("Write to file Done!")

def read_file(fileName):
  global rssiDataList

  with open(fileName, 'r') as f:
    next(f)
    reader = csv.reader(f)
    rssiDataList = sorted(list(reader), key=operator.itemgetter(3), reverse=False)
  print("Read RSSI Done")

def readBeaconData(fileName):
  global beaconDataList
  global sysStartTime, sysEndTime

  with open(fileName, 'r') as f:
    next(f)
    reader = csv.reader(f)
    dataList = sorted(list(reader), key=operator.itemgetter(1), reverse=False)
    i=0
    while i<len(dataList):
      if dataList[i][0]==beaconDev:
        if(int(dataList[i][1])<sysEndTime and int(dataList[i][1])>sysStartTime):
          beaconDataList.append(dataList[i])
      i+=1
  print("Read Beacon Done")

result=[]
result.append('id,time,lng,lat')
# def processEdges(interval, timestamp):
def processEdges(interval):
  edges         = getEdges()
  # now           = timestamp
  now           = int(time.time() * 1000)
  transmitters  = augmentGraph(edges, interval)
  locations     = transmitterLocations(transmitters)
  updates       = updateLocations(locations, delta=0.5)
  # print (edges)
  for deviceId in updates:
    # print (deviceId)
    topic = config['notifications']['positionUpdate']
    message = json.dumps({
      'id':     deviceId,
      'lng':    history[deviceId]['location']['lng'],
      'lat':    history[deviceId]['location']['lat'], 
      'map':    history[deviceId]['location']['map'],
      'time':   now
    })
    notify.send_multipart([topic.encode('utf-8'), message.encode('utf-8')])
    # result.append(str(deviceId) + ',' + str(timestamp)+','+ str(history[deviceId]['location']['lng']) + ',' + str(history[deviceId]['location']['lat']))

def updateOnEdges(xs, timeNow):
  global edges
  i=0
  # update edges
  for x in xs:
    x['updatedAt'] = timeNow
    if x['transmitterId'] in edges and x['receiverId'] in edges[x['transmitterId']]:
      # update
      edges[x['transmitterId']][x['receiverId']].update(x)
    else:
      # create
      x['createdAt'] = timeNow
      edges[x['transmitterId']].update({
        x['receiverId']: x
      })
    i+=1
  # expire edges
  rms = []
  for t in edges:
    for r in edges[t]:
      if int(timeNow) - int(edges[t][r]['updatedAt']) > 3000 + 10 * float(edges[t][r]['period']):
        rms.append((t,r))
  for t,r in rms:
    del edges[t][r]

####################################################################################
## THREADS
####################################################################################

def listenForCacheUpdates():
  global cacheBC
  while True:
    [topic, message] = notifications.recv_multipart()
    message = json.loads(message.decode())
    if message['version'] != cacheBC['version']:
      updateCacheBC()


requests = zmq.Context().socket(zmq.PULL)
requests.bind_to_random_port('tcp://137.132.165.139')
# requests.bind('tcp://137.132.165.139:5566')
# requests.bind('tcp://127.0.0.1:5566')

def main():
  global rssiDataList
  global result
  global beaconDataList
  global flag, done, ctHR, currentCharac, currentUUID
  # print(len(dataQueue))
  while len(dataQueue) > 0:
    # ct+=4
    ctHR+=1000
    x = dataQueue.popleft()
        # d = x['uuid']
    e = x['characteristic']
        # if d==currentUUID:
            # if e==currentCharac:
    if e== "fff1":
  # pdb.set_trace()
        homeRehab(x)
    else:
        print("Service not supported")
        # else:
        #     print("Characteristic not found")

  interval = 0.5

  while True:
    time.sleep(interval)
    try:
      processEdges(interval*1000)
    except:
      raise
###################
## HOME REHAB ALSO
###################

def dataReceive():
    global dataQueue
    global currentCharac, currentUUID, currentMode, dataEcgList, dataHrList, dataHomeList, endTime, currentMode, timeQueue, button

    # print("123")
    while True:
        # try:
        # print(len(dataQueue))
        x = requests.recv_json()

        if x['uuid'] == currentUUID and x['characteristic']==currentCharac:
            dataQueue.append(x)
            timeQueue.append(int(time.time()*1000))
        elif currentMode!=0:
            dataQueue.append(x)

        if int(time.time())>endTime:
            if currentMode!=0:
                endProcess()
        # except (KeyboardInterrupt, SystemExit):
        #     endProcess("ecg1Output_" + str(time.time()) + ".csv", dataEcgList,4)
        #     endProcess("homeOutput_" + str(time.time()) + ".csv", dataHomeList,20)
        #     endProcess("hrOutput_" + str(time.time()) + ".csv", dataHrList, 1000)
        #     raise
            

####################################################################################
## BEGIN
####################################################################################

# update cache
updateCacheBC()

# listen for cache notifications
t1 = threading.Thread(target=listenForCacheUpdates)
t1.setDaemon(True)
t1.start()
t2 = threading.Thread(target=dataReceive)
t2.setDaemon(True)
t2.start()

def writeToFiles():
    global homeFile,dataHomeList

    while True:
        if len(dataHomeList) != 0:
            homeFile.write(str(dataHomeList.popleft()) + '\n')

# read_file('./filteredRSSIData/ecg0_filteredRSSI_X2.csv')
#read_file('./filteredRSSIData/b1_filteredRSSI_X1.csv')
#readBeaconData('beacon_path_experimentX2.csv')

curdoc().add_root(column(row(ticker1, ticker2, duration, button),row(fig1, fig3), row(fig, figH)))
curdoc().add_periodic_callback(main,50)
# main loop
main()