import json
# import redis
import zmq
import time
import threading
import math
import random
import numpy as np
from collections import defaultdict
from datetime import timedelta
from shapely.geometry import Point
from shapely.geometry.polygon import Polygon
from operator import itemgetter
from pprint import PrettyPrinter
from storeScale import getScale, getCoordinates
from storePOI import getNavMesh, getPOI

pp = PrettyPrinter(indent=2)

####################################################################################
## REDIS, ZMQ
####################################################################################

config  = None
with open('./aws_config.json', 'r') as f:
  config = json.load(f)

# print (config['zmqSockets']['broker']['xsub'])
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

location = 'Walkway_to_B_test'
cache         = {}
cache_mesh = getNavMesh(location)
cache_POI = getPOI(location)
history       = defaultdict(lambda: {})
deviceId = 'original'
sysStartTime = time.time()*1000
checkpoints = { '1': [0,0], '2': [1,0], '3': [1,1], '4': [0,1], '5': [2,0], '6': [2,1], '7': [2,2], '8': [3,0], '9': [3,1], '10': [3,2]}
# print ("Experiment Start:", sysStartTime, datetime.fromtimestamp(int(sysStartTime).strftime("%Y-%m-%d %H:%M:%S")))
####################################################################################
## UTILITIES
####################################################################################

def updateCache():
  global cache
  cache = getCache()  
  print('loaded cache version', cache['version'])
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

def transmitterGraph(edges):
  d = defaultdict(lambda: {})
  for k, v in edges.items():
    receiverId      = v['receiverId']
    transmitterId   = v['transmitterId']
    beaconId        = cache['device'][transmitterId]['beaconId']
    measuredPower   = float(cache['beacon'][beaconId]['measuredPower'])
    rssi            = float(v['mu'])
    mapId           = cache['device'][receiverId]['mapId']
    scale           = float(cache['map'][mapId]['scale']) 
    distance        = rssiToDistance(rssi, measuredPower)
    # make dictionary
    d[transmitterId][receiverId] = {
      'distance': distance,
      'radians':  distance / scale,
      'scale':    scale,
      'lat':      float(cache['device'][receiverId]['lat']),
      'lng':      float(cache['device'][receiverId]['lng']),
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
    if cache['devices'][t]['type'] == 'mobile' and info}

def distance(a, b, scale):
  return scale * np.linalg.norm(a - b)

def findMinimum_Distance_Point(min_poly_points, point):
  i=0
  minimum_dist = 999
  tmp_dist = 0
  tmp_coord = []
  while i<len(min_poly_points):
    # print (min_poly_points[i])
    tmp_dist = point.distance(Point(min_poly_points[i]))
    if tmp_dist < minimum_dist:
      minimum_dist = tmp_dist
      tmp_coord = min_poly_points[i]
    i+=1
  return tmp_coord

def findDiagonalPoint(min_poly, point):
  min_poly_points = list(min_poly.exterior.coords)
  return findMinimum_Distance_Point(min_poly_points, point)

def findWherePointIs(min_poly, point):
  boundingCoords = min_poly.bounds
  if (point.y >= boundingCoords[1] and point.y <= boundingCoords[3]): #either left or right of polygon
    return 'horizontal'
  elif (point.x >= boundingCoords[0] and point.x <= boundingCoords[2]): #either top or bottom of polygon
    return 'vertical'
  else: #diagonally away from the polygon
    return 'diagonal'

def checkBoundary(lng, lat):
  global cache_mesh
  i = 0
  contains = []
  point = Point(lng, lat)
  while i< len(cache_mesh['map']['navMesh']['features']):
    pt1 = cache_mesh['map']['navMesh']['features'][i]['geometry']['coordinates'][0][0]
    pt2 = cache_mesh['map']['navMesh']['features'][i]['geometry']['coordinates'][0][1]
    pt3 = cache_mesh['map']['navMesh']['features'][i]['geometry']['coordinates'][0][2]
    pt4 = cache_mesh['map']['navMesh']['features'][i]['geometry']['coordinates'][0][3]
    polygon = Polygon([pt1, pt2, pt3, pt4])
    contains.append(polygon.contains(point))
    i+=1
  return contains, point

def shiftPtToSide(point, deviceId):
  global cache_mesh, history
  i = 0
  polys = []
  while i< len(cache_mesh['map']['navMesh']['features']):
    pt1 = cache_mesh['map']['navMesh']['features'][i]['geometry']['coordinates'][0][0]
    pt2 = cache_mesh['map']['navMesh']['features'][i]['geometry']['coordinates'][0][1]
    pt3 = cache_mesh['map']['navMesh']['features'][i]['geometry']['coordinates'][0][2]
    pt4 = cache_mesh['map']['navMesh']['features'][i]['geometry']['coordinates'][0][3]
    polys.append(Polygon([pt1, pt2, pt3, pt4]))
    i+=1
  min_poly = min(polys, key=point.distance)
  # print (min_poly, min_poly.bounds, list(min_poly.exterior.coords))
  point_orientation = findWherePointIs(min_poly, point)
  print (point_orientation)
  try:
    if polys.index(min_poly) == history[deviceId]['polygon']: #prev pos is in the same polygon
      if point_orientation == 'horizontal':
        return [history[deviceId]['location']['lng'], point.y]
      elif point_orientation == 'vertical':
        return [point.x , history[deviceId]['location']['lat']]
      else:
        return findDiagonalPoint(min_poly, point)
    else: #first point to be in polygon
      history[deviceId]['polygon'] = polys.index(min_poly)
      return findDiagonalPoint(min_poly, point)
  except KeyError:
    return [point.x, point.y]

def determineTrend(lng,lat):
  global history
  trend = ''
  change_lng = lng - history[deviceId]['location']['lng']
  change_lat = lat - history[deviceId]['location']['lat']
  if change_lng == max(change_lat,change_lng):
    if change_lng < 0:
      trend = 'left'
    elif change_lng > 0:
      trend = 'right'
    else: trend = 'no change'
    return trend, change_lng
  else:
    if change_lat < 0:
      trend = 'down'
    elif change_lat > 0:
      trend = 'up'
    else: trend = 'no change'
    return trend, change_lat

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

def between_decimals(min, max): 
  return random.uniform(min, max)


def processEdges(interval, POI):
  direction = ''
  now           = int(time.time() * 1000)
  try:
    _map = {
        "id": location,
          "coordinates": [
          [
            -0.5231213479707435,
            1.342988006344001
          ],
          [
            2.422659711427116,
            1.342988006344001
          ],
          [
            2.422659711427116,
            -0.7311312595476522
          ],
          [
            -0.5231213479707435,
            -0.7311312595476522
          ]
        ],
        "scale": 157
    }

    lng = POI['lng']
    lat = POI['lat']

    deviceId = 'original'

    print ("Sending position data...")
    topic = config['notifications']['positionUpdate']
    message = json.dumps({
        'id':     deviceId,
        'lng':    lng,
        'lat':    lat,
        'map':    _map,
        'time':   now
      })
    print (message)
    notify.send_multipart([topic.encode('utf-8'), message.encode('utf-8')])
    print ('================================================================')
    if history[deviceId] != {}: direction, change_pos = determineTrend(lng,lat)
    # for deviceId in updates:
    inObstacle, pos = checkBoundary(lng, lat)
    print (inObstacle)
    if True not in inObstacle:
      shiftedPos = shiftPtToSide(pos, deviceId)
      history[deviceId].update({
          'location': {
            'map': _map,
            'lat': shiftedPos[1],
            'lng': shiftedPos[0]
          },
          'inPolygon': False,
          # 'direction': direction
      })
    else:
      history[deviceId].update({
          'location': {
            'map': _map,
            'lat': lat,
            'lng': lng
          },
          'inPolygon': True,
          # 'direction': direction,
          'polygon': inObstacle.index(True)
      })
    print ("Sending position data...")
    topic = config['notifications']['positionUpdate']
    message = json.dumps({
        'id':     'shifted',
        'lng':    history[deviceId]['location']['lng'],
        'lat':    history[deviceId]['location']['lat'],
        'map':    history[deviceId]['location']['map'],
        # 'distance': 1,
        'time':   now
      })
    print (message) 
    notify.send_multipart([topic.encode('utf-8'), message.encode('utf-8')])
    print ('================================================================')
  except: raise

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
  global cache_POI
  interval = 2000
  i = 0
  start = sysStartTime
  timer = time.time()*1000
  exit = sysStartTime + 20000
  while timer < exit:
    while math.floor(timer-start) == 5:
      start+=interval
      try:
          processEdges(interval*1000, cache_POI[str(i+1)])
          timer = time.time()*1000
      except:
        raise
      i+=1
    timer = time.time()*1000

####################################################################################
## BEGIN
####################################################################################

# update cache
# updateCache()

# listen for cache notifications
# t1 = threading.Thread(target=listenForCacheUpdates)
# t1.setDaemon(True)
# t1.start()

# main loop
main()
