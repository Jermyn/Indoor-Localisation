import json
import zmq
import time
import threading
import numpy as np
from collections import defaultdict
from nlsq import nlsq
from rssi import rssiToDistance, rssiToDistanceVariance

from edges import getEdges
from cache import getCache

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

requests = zmq.Context().socket(zmq.REQ)
requests.connect(config['zmqSockets']['serverRequests']['reqrep'])

####################################################################################
## State
####################################################################################

cache         = {}
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

def updateCache():
  global cache
  requests.send_string(config['notifications']['cacheRequest'])
  cache = requests.recv_json()
  if cache and 'version' in cache:
    print('loaded cache version', cache['version'])

####################################################################################
## Methods
####################################################################################

def transmitterGraph(edges, interval):
  d = defaultdict(lambda: {})
  for k, v in edges.items():
    try:
      receiverId      = v['receiverId']
      transmitterId   = v['transmitterId']
      beaconId        = cache['device'][transmitterId]['beaconId']
      measuredPower   = float(cache['beacon'][beaconId]['measuredPower'])
      rssi            = float(v['mu'])
      sigma           = float(v['sigma'])
      numObservations = interval / float(v['period'])
      mapId           = cache['device'][receiverId]['mapId']
      scale           = float(cache['map'][mapId]['scale'])
      distance        = rssiToDistance(rssi, measuredPower)
      sigmaDistance   = rssiToDistanceVariance(rssi, sigma, measuredPower)
      sigmaRadians    = sigmaDistance / scale**2
      # make dictionary
      d[transmitterId][receiverId] = {
        'distance':         distance,
        'radians':          distance / scale,
        'sigmaDistance':    sigmaDistance,
        'sigmaRadians':     sigmaRadians,
        'numObservations':  numObservations,
        'scale':            scale,
        'lat':              float(cache['device'][receiverId]['lat']),
        'lng':              float(cache['device'][receiverId]['lng']),
        'mapId':            mapId
      }
    except:
      continue
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
  nbrs        = list(nbrsInfo.keys())
  mapId       = nbrsInfo[nbrs[0]]['mapId']

  # # use neighbours as bounds
  # nbrsPos = np.array([ [ nbrsInfo[nbr]['lng'], nbrsInfo[nbr]['lat'] ] for nbr in nbrs ])
  # bounds =(
  #   np.array([nbrsPos[:,0].min(), nbrsPos[:,1].min()]),
  #   np.array([nbrsPos[:,0].max(), nbrsPos[:,1].max()])
  # )

  # use map coordinates ans bounds
  coordinates = np.array(json.loads(cache['map'][mapId]['coordinates']))
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
  return (mapId, pos)

def transmitterLocations(transmitters):
  return { k: calculateLocation(k, v) for k, v in transmitters.items() if cache['device'][k]['type'] == 'mobile'}

def distance(a, b, scale):
  return scale * np.linalg.norm(a - b)

def updateLocations(locations, delta):
  global history
  updates = set()
  for deviceId, (mapId, pos) in locations.items():
    scale = float(cache['map'][mapId]['scale'])
    if (deviceId not in history) or (deviceId in history and distance(pos, history[deviceId]['pos'], scale) > delta):
      updates.add(deviceId)
    history[deviceId].update({'pos': pos, 'mapId': mapId, 'scale': scale})
  return updates

def processEdges(interval):
  edges         = redisHashZsetToDict('edge', None)
  now           = int(time.time() * 1000)
  transmitters  = transmitterGraph(edges, interval)
  locations     = transmitterLocations(transmitters)
  updates       = updateLocations(locations, delta=1)

  # update edges with additional data
  pipe = r.pipeline()
  for transmitter in transmitters:
    for receiver in transmitters[transmitter]:
      pipe.hmset('edge:'+transmitter+':'+receiver, {
        'distance': transmitters[transmitter][receiver]['distance'],
        'radians': transmitters[transmitter][receiver]['radians'],
        'sigmaDistance': transmitters[transmitter][receiver]['sigmaDistance'],
        'sigmaRadians': transmitters[transmitter][receiver]['sigmaRadians']
      })
  pipe.execute()

  print(updates)

  for deviceId in updates:
    key = 'device:' + deviceId
    if r.exists(key):
      # redis
      r.hmset(key, {
        'lng':    history[deviceId]['pos'][0],
        'lat':    history[deviceId]['pos'][1], 
        'mapId':  history[deviceId]['mapId']
      })
      # zmq
      topic = config['notifications']['positionUpdate']
      message = json.dumps({
        'id':     deviceId,
        'lng':    history[deviceId]['pos'][0],
        'lat':    history[deviceId]['pos'][1], 
        'mapId':  history[deviceId]['mapId'],
        'scale':  history[deviceId]['scale'],
        'time':   now
      })
      notify.send_multipart([topic.encode('utf-8'), message.encode('utf-8')])

####################################################################################
## THREADS
####################################################################################

def listenForCacheUpdates():
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
      print('error')
      raise
      pass

####################################################################################
## BEGIN
####################################################################################

# update cache
updateCache()

# listen for cache notifications
t1 = threading.Thread(target=listenForCacheUpdates)
t1.setDaemon(True)
t1.start()

# main loop
main()
