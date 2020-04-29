import json
import zmq
import time
import threading
import numpy as np
from collections import defaultdict
from nlsq import nlsq
from rssi import rssiToDistance, rssiToDistanceVariance
from cache import getCache
from aggregate import getEdges
from pprint import PrettyPrinter

pp = PrettyPrinter(indent=2)

####################################################################################
## REDIS, ZMQ
####################################################################################

config  = None
with open('../config.json', 'r') as f:
  config = json.load(f)

notifications = zmq.Context().socket(zmq.SUB)
notifications.setsockopt_string(zmq.SUBSCRIBE, config['notifications']['cacheUpdate'])
notifications.connect(config['zmqSockets']['broker']['xpub'])
notify = zmq.Context().socket(zmq.PUB)
notify.connect(config['zmqSockets']['broker']['xsub'])

####################################################################################
## State
####################################################################################

cache         = {}
history       = defaultdict(lambda: {})

####################################################################################
## UTILITIES
####################################################################################

def updateCache():
  global cache
  cache = getCache()  
  print('loaded cache version', cache['version'])

####################################################################################
## Methods
####################################################################################

def augmentGraph(edges, interval):
  # augment info
  rems = []
  for t in edges:
    for r in edges[t]:
      try:
        measuredPower = float(cache['devices'][t]['beacon']['measuredPower'])
        rssi          = float(edges[t][r]['mu'])
        sigma         = float(edges[t][r]['sigma'])
        period        = float(edges[t][r]['period'])
        location      = cache['devices'][r]['location']
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

def transmitterLocations(transmitters):
  return { t: calculateLocation(t, info) \
    for t, info in transmitters.items() \
    if cache['devices'][t]['type'] == 'mobile' and info}

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

def processEdges(interval):
  now           = int(time.time() * 1000)
  edges         = getEdges()
  transmitters  = augmentGraph(edges, interval)
  locations     = transmitterLocations(transmitters)
  updates       = updateLocations(locations, delta=0.5)
  # notify new positions
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
  global cache
  while True:
    [topic, message] = notifications.recv_multipart()
    message = json.loads(message.decode())
    if message['version'] != cache['version']:
      updateCache()

def main():
  interval = 0.5
  while True:
    time.sleep(interval)
    try:
      processEdges(interval * 1000)
    except:
      raise

####################################################################################
## BEGIN
####################################################################################

# get cache
updateCache()

# listen for cache notifications
t1 = threading.Thread(target=listenForCacheUpdates)
t1.setDaemon(True)
t1.start()

# main loop
main()
