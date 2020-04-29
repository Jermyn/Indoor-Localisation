import json
import redis
import zmq
import time
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
cache={}
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

# r = redis.Redis(charset="utf-8", decode_responses=True)

notifications = zmq.Context().socket(zmq.SUB)
notifications.setsockopt_string(zmq.SUBSCRIBE, config['notifications']['cacheUpdate'])
notifications.connect(config['zmqSockets']['broker']['xpub'])

notify = zmq.Context().socket(zmq.PUB)
notify.connect(config['zmqSockets']['broker']['xsub'])

# requests = zmq.Context().socket(zmq.REQ)
# requests.connect(config['zmqSockets']['serverRequests']['reqrep'])

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
  print('loaded cache version', cacheBC['version'])
  # requests.send_string(config['notifications']['cacheRequest'])
  # cache = requests.recv_json()
  # if cache and 'version' in cache:
    # print('loaded cache version', cache['version'])

####################################################################################
## Methods
####################################################################################

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
    mapId           = cacheBc['device'][receiverId]['mapId']
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

def transmitterLocations(transmitters):
  return { t: calculateLocation(t, info) \
    for t, info in transmitters.items() \
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

def processEdges(interval):
  edges         = getEdges()
  now           = int(time.time() * 1000)
  transmitters  = augmentGraph(edges, interval)
  locations     = transmitterLocations(transmitters)
  updates       = updateLocations(locations, delta=0.5)

  for deviceId in updates:
    topic = config['notifications']['positionUpdate']
    message = json.dumps({
      'id':     deviceId,
      'lng':    history[deviceId]['location']['lng'],
      'lat':    history[deviceId]['location']['lat'], 
      'map':    history[deviceId]['location']['map'],
      'time':   now
    })
    notify.send_multipart([topic.encode('utf-8'), message.encode('utf-8')])

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

def main():
  interval = 0.5
  while True:
    time.sleep(interval)
    try:
      processEdges(interval*1000)
    except:
      raise

####################################################################################
## BEGIN
####################################################################################

# update cache
updateCacheBC()

# listen for cache notifications
t1 = threading.Thread(target=listenForCacheUpdates)
t1.setDaemon(True)
t1.start()

# main loop
main()
