import json
import redis
import zmq
import time
import threading
import numpy as np
from collections import defaultdict
from bayesian import bayesian
from kalman import kalman2d

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
  d = {}
  if members:
    return { m: r.hgetall(name + ':' + m) for m in members}
  else:
    return { m: r.hgetall(name + ':' + m) for m in r.zrange(name, 0, -1)}

def updateCache():
  global cache
  requests.send_string(config['notifications']['cacheRequest'])
  cache = requests.recv_json()
  if cache and 'version' in cache:
    print('loaded cache version', cache['version'])

def distance(a, b, scale):
  return scale * np.linalg.norm(a - b)

####################################################################################
## Methods
####################################################################################

def transmitterGraph(edges):
  d = defaultdict(lambda: {})
  for k, v in edges.items():
    try:
      receiverId    = v['receiverId']
      transmitterId = v['transmitterId']
      mapId         = cache['device'][receiverId]['mapId']
      # make dictionary
      d[transmitterId][receiverId] = {
        'distance': float(v['mu']) / float(cache['map'][mapId]['scale']),
        'scale':    float(cache['map'][mapId]['scale']),
        'lat':      float(cache['device'][receiverId]['lat']),
        'lng':      float(cache['device'][receiverId]['lng']),
        'mapId':    mapId
      }
      # remove nodes which are not in the same map as the closest node
      for transmitter in d.keys():
        closest = sorted(d[transmitter].keys(), key=lambda k: d[transmitter][k]['distance'])[0]
        mapId = d[transmitter][closest]['mapId']
        for receiver, v in d[transmitter].items():
          if v['mapId'] != mapId:
            del d[transmitter][receiver]
    except:
      try:
        del d[v['transmitterId']][v['receiverId']]
      except:
        pass
  return d

def calculateLocation(n, nbrs):
  mapId = nbrs[list(nbrs.keys())[0]]['mapId']
  pos = bayesian(
    n,
    sorted(nbrs.keys(), key=lambda k: nbrs[k]['distance']),
    nbrs
  )
  return (mapId, pos)

def transmitterLocations(transmitters):
  return { k: calculateLocation(k, v) for k, v in transmitters.items() }

def processEdges():
  global history

  now           = int(time.time() * 1000)
  deviceSet     = r.smembers('device')
  queued        = r.pipeline().lrange('edge:queue', 0, -1).ltrim('edge:queue', -1, -2).execute()[0]
  # edges         = redisHashZsetToDict('edge', queued)
  edges         = redisHashZsetToDict('edge', None)

  # iterative bayesian
  transmitters  = transmitterGraph(edges)
  locations     = transmitterLocations(transmitters)

  pipe = r.pipeline()
  for k, (mapId, pos_observation) in locations.items():
    
    scale = float(cache['map'][mapId]['scale'])
    # final kalman filter
    (pos_posterior, sigma_posterior) = kalman2d(
      pos_prior=history[k]['pos'] if k in history else np.matrix([0, 0]).T,
      sigma_prior=history[k]['sigma'] if k in history else np.matrix([[100 / scale, 0],[0, 100 / scale]]),
      pos_observation=pos_observation,
      sigma_observation=np.matrix([[5.0/scale, 0], [0, 5.0/scale]]),
      process_noise=np.matrix([[2/scale, 0], [0, 2/scale]])
    )
    history[k].update({
      'pos':    pos_posterior,
      'sigma':  sigma_posterior,
      'mapId':  mapId
    })

    # update position and log history
    if (
      k in deviceSet
      and (
        'pos_update' not in history[k] 
        or distance(history[k]['pos_update'], pos_posterior, scale) > 1
      )
    ):
      history[k].update({
        'pos_update': pos_posterior
      })
      pipe.hmset('device:' + k, {
        'lng':    pos_posterior[0,0],
        'lat':    pos_posterior[1,0], 
        'mapId':  mapId
      })
      pipe.zadd('history', 
        json.dumps({
          'id':     k,
          'lng':    pos_posterior[0,0],
          'lat':    pos_posterior[1,0],
          'mapId':  mapId,
          'time':   now
        })
        , now
      )

  # keep only last 30 days of data
  pipe.zremrangebyscore('history', '-inf', now - 30 * 24 * 60 * 60 * 1000)
  pipe.execute()

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
  while True:
    time.sleep(0.2)
    processEdges()

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
