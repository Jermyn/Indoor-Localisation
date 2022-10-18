import json
import zmq
import time
import threading
import csv
import operator
import copy
import numpy as np
from collections import defaultdict
from nlsq import nlsq
from rssi import rssiToDistance, rssiToDistanceVariance
from datetime import datetime, timedelta
from cache import getCache
# from aggregate import getEdges
# from pprint import PrettyPrinter

edges = defaultdict(lambda: {})


# pp = PrettyPrinter(indent=2)

# ####################################################################################
# ## REDIS, ZMQ
# ####################################################################################

# config  = None
# with open('../config.json', 'r') as f:
#   config = json.load(f)

# notifications = zmq.Context().socket(zmq.SUB)
# notifications.setsockopt_string(zmq.SUBSCRIBE, config['notifications']['cacheUpdate'])
# notifications.connect(config['zmqSockets']['broker']['xpub'])
# notify = zmq.Context().socket(zmq.PUB)
# notify.connect(config['zmqSockets']['broker']['xsub'])

# ####################################################################################
# ## State
# ####################################################################################

cache         = getCache()
history       = defaultdict(lambda: {})

# ####################################################################################
# ## UTILITIES
# ####################################################################################

# def updateCache():
#   global cache
#   cache = getCache()  
#   print('loaded cache version', cache['version'])

####################################################################################
## Methods
####################################################################################

rssiDataList=[]
beaconDataList=[]
beaconDev = 'b2'
# sysStartTime=datetime.strptime("2017-08-10 14.56.56.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysEndTime=datetime.strptime("2017-08-10 15.15.25.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2017-08-11 14.57.04.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysEndTime=datetime.strptime("2017-08-11 15.14.49.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2019-01-17 18.55.20.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Mini_Actlab
# sysEndTime=datetime.strptime("2019-01-17 19.00.35.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2019-01-21 17.28.10.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000 ##Mini-actlab2
# sysEndTime=datetime.strptime("2019-01-21 17.30.45.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2019-01-22 08.47.00.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000 ##Mini-actlab3
# sysEndTime=datetime.strptime("2019-01-22 08.51.00.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
sysStartTime = datetime.strptime("2021-10-06 17.39.01.028", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000  # Experiment4
sysEndTime = datetime.strptime("2021-10-06 17.50.59.685", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000


def augmentGraph(edges, interval):
  # augment info
  global cache

  rems = []
  for t in edges:
    for r in edges[t]:
      try:
        measuredPower = -63.0
        rssi          = float(edges[t][r]['mu'])
        sigma         = float(edges[t][r]['sigma'])
        period        = float(edges[t][r]['period'])
        i=0
        while i< len(cache['anchors']):
          if cache['anchors'][i]['device']['location'] != 'null':
            if cache['anchors'][i]['device']['location']['map']['id'] == 'actlab':
          if(cache['anchors'][i]['id']==r):

            location = cache['anchors'][i]['device']['location']
            break
          i+=1

        # location      = cache['devices'][r]['location']
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

def calculateLocation(n, nbrsInfo):
  nbrs        = list(nbrsInfo.keys())
  _map        = nbrsInfo[nbrs[0]]['location']['map']
  coordinates = np.array(_map['coordinates'])
  bounds      = (
    np.array([coordinates[:,0].min(), coordinates[:,1].min()]),
    np.array([coordinates[:,0].max(), coordinates[:,1].max()])
  )
  pos = nlsq(
    n,
    nbrs,
    nbrsInfo,
    history,
    bounds
  )
  return {
    'map': _map,
    'latLng': pos,
    'lat': pos[1],
    'lng': pos[0]
  }

def searchCacheDevices(deviceId):
  i=0
  while i< len(cache['devices']):
    if(cache['devices'][i]['id']==deviceId):
      return cache['devices'][i]['type'] 
    i+=1

def transmitterLocations(transmitters):
  return { t: calculateLocation(t, info) \
    for t, info in transmitters.items() \
    if searchCacheDevices(t) == 'mobile' and info}

def distance(a, b, scale):
  return scale * np.linalg.norm(a - b)

def updateLocations(locations, delta):
  global history
  updates = set()
  for deviceId, location in locations.items():
    _map = location['map']
    # create if not exist
    if (deviceId not in history) or \
    (deviceId in history): ###and \
    # distance(location['latLng'], history[deviceId]['location']['latLng'], _map['scale']) > delta):
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
  # return set of updated devices
  return updates

def getEdges():
  global edges
  return copy.deepcopy(edges)

result=[]
result.append('id,time,lng,lat')
#rssiData structure: anchorID, mu, sigma, timestamp
def processEdges(interval, timestamp):
  global result

  now           = timestamp
  edges         = getEdges()
  transmitters  = augmentGraph(edges, interval)
  locations     = transmitterLocations(transmitters)

  try:
    updates       = updateLocations(locations, delta=0)
    # notify new positions
    for deviceId in updates:
      # topic = config['notifications']['positionUpdate']
      message = json.dumps({
        'id':     deviceId,
        'lng':    history[deviceId]['location']['lng'],
        'lat':    history[deviceId]['location']['lat'], 
        'map':    history[deviceId]['location']['map'],
        'time':   timestamp
      })
      result.append(str(deviceId) + ',' + str(timestamp)+','+ str(history[deviceId]['location']['lng']) + ',' + str(history[deviceId]['location']['lat']))
      # notify.send_multipart([topic.encode('utf-8'), message.encode('utf-8')])
  except: pass

def writeToFile(rawData):
  data = rawData

  write_file = str("./" + sys.argv[1] + "/actlab_location_test3_06Oct_chairkalman.csv")
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


  # processRaw(rawData_list)

# ####################################################################################
# ## THREADS
# ####################################################################################

# def listenForCacheUpdates():
#   global cache
#   while 'true':
#     [topic, message] = notifications.recv_multipart()
#     message = json.loads(message.decode())
#     if message['version'] != cache['version']:
#       updateCache()

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


def main():
  global rssiDataList
  global result
  global beaconDataList

  bufferList=[]
  interval = 0.5
  flag=0
  timer = sysStartTime + 100
  i=0
  while i<len(rssiDataList):
    ref = int(rssiDataList[i][3])
    currentData = {"transmitterId": beaconDev, "receiverId":rssiDataList[i][0], "period":rssiDataList[i][4], "mu":rssiDataList[i][1], "sigma":rssiDataList[i][2]}
    # if(int(rssiDataList[i][3])<=timer):
    bufferList.append(currentData)
    # else:
    updateOnEdges(bufferList, ref)
    processEdges(interval*1000, ref)
      # timer += 100
      # if timer > sysEndTime:
      #     break
    bufferList=[]
      # bufferList.append(currentData)
    # if(int(rssiDataList[i][3])<=int(beaconDataList[flag][1])):
    #   bufferList.append(currentData)
    # else:
    #   updateOnEdges(bufferList, beaconDataList[flag][1])
    #   processEdges(interval*1000, beaconDataList[flag][1])
    #   flag+=1
    #   if(flag==len(beaconDataList)):
    #     break
    #   bufferList=[]
    #   bufferList.append(currentData)
    i+=1
  writeToFile(result)

# ####################################################################################
# ## BEGIN
# ####################################################################################

# # get cache
# # updateCache()

# # listen for cache notifications
# t1 = threading.Thread(target=sendEdges)
# t1.setDaemon('true')
# t1.start()

read_file('./' + sys.argv[1] + 'actlab_rssi_Test3_06Oct_kalmanFiltered.csv')
# readBeaconData('beacon_path_experimentX2.csv')
# main loop
main()
