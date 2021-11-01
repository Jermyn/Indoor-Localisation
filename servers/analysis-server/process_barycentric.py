import json
# import redis
# import zmq
import time
import math
import copy
import threading
import numpy as np
from collections import defaultdict
from barycentric import barycentric
from rssi import rssiToDistance, rssiToDistanceVariance
from cache import getCache
# from aggregate import getEdges
from pprint import PrettyPrinter
from datetime import datetime
# from bestFitLine import getBestFit
# from formulaTest import getEqn, calibratemain
import csv
import operator
import pdb
import sys

pp = PrettyPrinter(indent=2)
edges = defaultdict(lambda: {})

####################################################################################
## REDIS, ZMQ
####################################################################################

# config  = None
# with open('../config.json', 'r') as f:
#   config = json.load(f)

# r = redis.Redis(charset="utf-8", decode_responses=True)

# notifications = zmq.Context().socket(zmq.SUB)
# notifications.setsockopt_string(zmq.SUBSCRIBE, config['notifications']['cacheUpdate'])
# notifications.connect(config['zmqSockets']['broker']['xpub'])

# notify = zmq.Context().socket(zmq.PUB)
# notify.connect(config['zmqSockets']['broker']['xsub'])

# requests = zmq.Context().socket(zmq.REQ)
# requests.connect(config['zmqSockets']['serverRequests']['reqrep'])

####################################################################################
## State
####################################################################################

cache         = getCache()
history       = defaultdict(lambda: {})
errDist = {}
index = 0

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

def updateCache():
  global cache
  requests.send_string(config['notifications']['cacheRequest'])
  cache = requests.recv_json()
  if cache and 'version' in cache:
    print('loaded cache version', cache['version'])

####################################################################################
## Methods
####################################################################################

rssiDataList=[]
beaconDataList=[]
beaconDev = 'b2'
# sysStartTime=datetime.strptime("2018-07-13 13.35.00.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysEndTime=datetime.strptime("2018-07-13 14.35.00.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2017-08-11 14.57.04.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysEndTime=datetime.strptime("2017-08-11 15.14.49.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2018-10-22 13.37.41.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysEndTime=datetime.strptime("2018-10-22 13.54.53.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2019-01-17 18.55.20.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000 ##Mini-actlab
# sysEndTime=datetime.strptime("2019-01-17 19.00.35.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2019-01-21 17.28.10.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000 ##Mini-actlab2
# sysEndTime=datetime.strptime("2019-01-21 17.30.45.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2019-01-22 08.47.40.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000 ##Mini-actlab3
# sysEndTime=datetime.strptime("2019-01-22 08.50.25.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2019-02-08 16.50.20.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000 ##Mini-actlab4
# sysEndTime=datetime.strptime("2019-02-08 16.53.45.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2019-02-08 13.24.35.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Mini_Actlab4_calibrate
# sysEndTime=datetime.strptime("2019-02-08 16.37.25.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2019-05-30 11.09.35.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Experiment5
# sysEndTime=datetime.strptime("2019-05-30 11.16.01.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2020-03-17 11.16.29.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Experiment3_HJ
# sysEndTime=datetime.strptime("2020-03-17 11.25.07.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2020-03-20 13.13.42.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Experiment1_Jermyn
# sysEndTime=datetime.strptime("2020-03-20 13.20.27.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2021-06-17 15.45.00.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#AWS_Test1
# sysEndTime=datetime.strptime("2021-06-17 15.48.00.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2021-07-07 11.31.15.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#fake_test1
# sysEndTime=datetime.strptime("2021-07-07 11.34.45.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2021-07-08 17.41.30.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#actlab_test1
# sysEndTime=datetime.strptime("2021-07-08 17.48.05.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2021-09-28 19.17.40.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#actlab_test2
# sysEndTime=datetime.strptime("2021-09-28 19.22.45.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
# sysStartTime=datetime.strptime("2021-10-05 17.03.01.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#actlab_test2
# sysEndTime=datetime.strptime("2021-10-05 17.04.00.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000
sysStartTime = datetime.strptime("2021-10-06 17.39.01.028", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000  # Experiment4
sysEndTime = datetime.strptime("2021-10-06 17.50.59.685", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

def convertFromMAC(receiverId):
  for data in cache['anchors']:
      if data['device'] != 'null' and data['device']['location'] != 'null':
        if data['device']['location']['map']['id'] == 'actlab':
          if data['device']['id'] == receiverId:
            print(data['id'])
            return data['id']
  return False

def augmentGraph(edges, interval):
  # augment info
  global cache
  rems = []
  for t in edges:
    for r in edges[t]:
      try:
        # pdb.set_trace()
        # measuredPower = -63.0
        rssi          = float(edges[t][r]['mu'])
        sigma         = float(edges[t][r]['sigma'])
        period        = float(edges[t][r]['period'])
        i=0
        # print (cache['navMesh'][0]['geometry']['coordinates'])
        while i< len(cache['anchors']):
          # print(cache['anchors'][i]['id'])
          # pdb.set_trace()
          if cache['anchors'][i]['device']['location'] != 'null':
            if cache['anchors'][i]['device']['location']['map']['id'] == 'actlab':
              # if r != 'Bed4':
              # print (cache['anchors'][i]['device']['id'], r)
              if(cache['anchors'][i]['id']==r):
                dev = cache['anchors'][i]['device']['id']
                # print (cache['anchors'][i]['device']['id'])
                # a,b,eqn = getEqn(cache['anchors'][i]['device']['id'])
                # a, b = getBestFit(cache['anchors'][i]['id'])
                # print (cache['anchors'][i]['id'], getBestFit(cache['anchors'][i]['id']))
                # sys.exit()
                # print(cache['anchors'][i]['id'])
                location = cache['anchors'][i]['device']['location']
                measuredPower = cache['anchors'][i]['measuredPower']
                # print (measuredPower, cache['anchors'][i]['id'])
                break
          i+=1
        # location      = cache['devices'][r]['location']
        sigmaDistance = rssiToDistanceVariance(rssi, sigma, measuredPower)
        # distance = eqn(a,b,rssi)
        # distance = a + (b * rssi) ##best fit line
        # distance = math.exp((rssi - a)/b)
        print (dev, distance, rssi)
        # if distance < 0 or distance > 10:
        #   print (distance, r)
        distance      = rssiToDistance(rssi, measuredPower)
        scale         = location['map']['scale']
        sigmaRadians  = sigmaDistance / scale**2
        # pdb.set_trace()
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
        raise

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
  # print (edges)
  return edges

def convertDevice(receiverId):
  for data in cache['anchors']:
    if data['device'] != 'null':
      # print (data['id'])
      if data['id'] == receiverId:
        return data['device']['id']
  return False

def write_dist(posDistFile, errDist):
  # print (errDist)
  with open(posDistFile, 'a') as fp:
    json_string = json.dumps(errDist, sort_keys=True, indent=2)
    fp.write(json_string + ",\n")

def calculateLocation(n, nbrsInfo, timestamp):
  global index, errDist
  index += 1
  nbrs  = list(nbrsInfo.keys())
  nbrs_dist = list(nbrsInfo.values())
  _map        = nbrsInfo[nbrs[0]]['location']['map']
  for info in range(0, len(nbrs)):
    # print (convertDevice(nbrs[info]), nbrs_dist[info]['distance'])
    # if index not in errDist:
    #   errDist = {index: {}}
    if convertDevice(nbrs[info]) not in errDist:
      errDist.update({ convertDevice(nbrs[info]): {} })
    errDist[convertDevice(nbrs[info])] = {'distance': nbrs_dist[info]['distance'], 'rssi': nbrs_dist[info]['rssi'] }
    # write_dist(posDistFile, index, convertDevice(nbrs[info]), nbrs_dist[info]['distance'])
  # pdb.set_trace()
  pos   = barycentric(
    n,
    nbrs,
    nbrsInfo
  )
  # print (pos, timestamp)
  # print ("------------------------------------")
  # posDistFile.write('------------------------------------\n')
  # posDistFile.write(str(pos[0,0]) + "," + str(pos[1,0]) + "," + str(timestamp) + "\n\n")
  errDist.update({'timestamp': timestamp, 'lng': pos[0,0], 'lat': pos[1,0]})
  write_dist('posDist(chair_kalman).json', errDist)
  # pdb.set_trace()
  return {
    'map': _map,
    'latLng': pos,
    'lat': pos[1,0],
    'lng': pos[0,0]
  }

def calculateLocationUsingNeighbors(n, nbrsInfo):
  nbrs = list(nbrsInfo.keys())
  _map = nbrsInfo[nbrs[0]]['location']['map']
  pos = barycentric(
    n,
    nbrs,
    nbrsInfo
  )
  # neighbors[n].update({
  #     'neighbors': nbrs
  # })
  return {
    'map': _map,
    'latLng': pos,
    'lat': pos[1,0],
    'lng': pos[0,0]
  }

def searchCacheDevices(deviceId):
  i=0
  while i< len(cache['devices']):
    if(cache['devices'][i]['id']==deviceId):
      return cache['devices'][i]['type'] 
    i+=1

def transmitterLocations(transmitters, timestamp):
  return { t: calculateLocation(t, info, timestamp) \
    for t, info in transmitters.items() \
    if searchCacheDevices(t) == 'mobile' and info}

def sortDict(x):
  key = list(x.keys())
  return x[key[0]]['distance']

def findNearestNeighbors(transmitters):
  nearest = []
  result = {}
  for t, info in transmitters.items():
    anchorInfo = list(info.keys())
    if searchCacheDevices(t) == 'mobile' and info:
      for anchor in anchorInfo:
        # nearest.append({"anchor": anchor, "distance" : info[anchor]['distance'], "location": {"lat": info[anchor]["location"]["lat"], "lng": info[anchor]["location"]["lng"]}})
        nearest.append({anchor: {"distance" : info[anchor]['distance'], "location": {"map": info[anchor]["location"]["map"], "lat": info[anchor]["location"]["lat"], "lng": info[anchor]["location"]["lng"]}}})
      sorted_nearest = sorted(nearest, key=sortDict)
      for index in range(0, 4):
        key = list(sorted_nearest[index].keys())
        # if sorted_nearest[index][key[0]]['distance'] <= 5.0:
        result.update(sorted_nearest[index])
      #   print (sorted_nearest[index][key[0]]['distance'])
      # print ("---------------------------")
    return { t: calculateLocationUsingNeighbors(t, result)}


def distance(a, b, scale):
  # print (scale * np.linalg.norm(a - b))
  return scale * np.linalg.norm(a - b)

def checkBoundary(a):
  global cache
  i = 0
  contains = []
  while i< len(cache['navMesh']):
    pt1 = cache['navMesh'][i]['geometry']['coordinates'][0][0]
    pt2 = cache['navMesh'][i]['geometry']['coordinates'][0][1]
    pt3 = cache['navMesh'][i]['geometry']['coordinates'][0][2]
    pt4 = cache['navMesh'][i]['geometry']['coordinates'][0][3]
    minXpt = min(pt1[0], pt2[0], pt3[0], pt4[0])
    maxXpt = max(pt1[0], pt2[0], pt3[0], pt4[0])
    minYpt = min(pt1[1], pt2[1], pt3[1], pt4[1])
    maxYpt = max(pt1[1], pt2[1], pt3[1], pt4[1])
    i+=1
    contains.append(((a[0] > minXpt and a[0] < maxXpt) and (a[1] > minYpt and a[1] < maxYpt)))
  return contains


def updateLocations(locations, delta):
  global history
  updates = set()
  for deviceId, location in locations.items():
    _map = location['map']
     # create if not exist
    if (deviceId not in history) or \
    (deviceId in history) and \
    distance(location['latLng'], history[deviceId]['location']['latLng'], _map['scale']) > delta:
      # if True not in checkBoundary(location['latLng']):
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
#   # print (edges)
#   return copy.deepcopy(edges)

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

def getEdges():
  global edges
  return copy.deepcopy(edges)

result=[]
result.append('id,time,lng,lat')
def processEdges(interval, timestamp):
  global result
  now           = timestamp
  edges         = getEdges()
  # print (edges)
  transmitters  = augmentGraph(edges, interval)
  # print(transmitters['b2'])
  # print ("transmitters...: ", transmitters[beaconDev][convertFromMAC(sys.argv[2])]['rssi'], transmitters[beaconDev][convertFromMAC(sys.argv[2])]['distance'])
  locations     = transmitterLocations(transmitters, timestamp)
  
  # print ("locations:", locations)
  try:
    # locations     = findNearestNeighbors(transmitters)
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
      # pdb.set_trace()
      result.append(str(deviceId) + ',' + str(timestamp)+','+ str(history[deviceId]['location']['lng']) + ',' + str(history[deviceId]['location']['lat']))
      # notify.send_multipart([topic.encode('utf-8'), message.encode('utf-8')])
  except:
    pass

def updateOnEdges(xs, timeNow):
  global edges
  i=0
  # print (edges)
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
  # print (edges)
  # pdb.set_trace()
  # expire edges
  rms = []
  for t in edges:
    for r in edges[t]:
      # print (edges[t][r])
      if int(timeNow) - int(edges[t][r]['updatedAt']) > 3000 + 10 * float(edges[t][r]['period']):
        rms.append((t,r))
  for t,r in rms:
    del edges[t][r]
  # print (edges)

####################################################################################
## THREADS
####################################################################################

# def listenForCacheUpdates():
#   while True:
#     [topic, message] = notifications.recv_multipart()
#     message = json.loads(message.decode())
#     if message['version'] != cache['version']:
#       updateCache()

def main():
  global rssiDataList
  global result
  global beaconDataList
  bufferList=[]
  interval = 0.5
  flag=0
  i=0
  # timer = sysStartTime + 1000
  # ref = int(rssiDataList[0][3])
  # offset = ref - sysStartTime
  # timer = sysStartTime + offset
  # print (rssiDataList[0])
  while i<len(rssiDataList):
    ref = int(rssiDataList[i][3])
    # pdb.set_trace()
    # if rssiDataList[i][2] != 'nan' or rssiDataList[i][3] != 'nan' or rssiDataList[i][4] != 'nan':
    currentData = {"transmitterId": beaconDev, "receiverId":rssiDataList[i][0], "period":rssiDataList[i][4], "mu":rssiDataList[i][1], "sigma":rssiDataList[i][2]}
    # rssiDataList[i][3] = datetime.strptime(rssiDataList[i][3], "%Y-%m-%d %H:%M:%S").timestamp()*1000
    # if(int(rssiDataList[i][3])<=timer):
    bufferList.append(currentData)
    # else:
    updateOnEdges(bufferList, ref)
    processEdges(interval*1000, ref)
      # timer += 1000
      # if timer > sysEndTime:
      #   updateOnEdges(bufferList, timer)
      #   processEdges(interval*1000, timer)
      #     break
    bufferList=[]
      # bufferList.append(currentData)
    i+=1
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
      
  # print (result)
  writeToFile(result)

####################################################################################
## BEGIN
####################################################################################

# update cache
# updateCache()
# listen for cache notifications
# t1 = threading.Thread(target=listenForCacheUpdates)
# t1.setDaemon(True)
# t1.start()
read_file('./' + sys.argv[1] + 'actlab_rssi_Test3_06Oct_kalmanFiltered.csv')
# read_file('/Users/jermz/Desktop/b1_RSSI_mini_actlab4_nofilter.csv')
# readBeaconData('positions_actlab_500cm.csv')
# main loop
# main()

# main loop
main()
