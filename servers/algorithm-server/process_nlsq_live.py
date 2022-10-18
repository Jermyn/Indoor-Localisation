import json
import zmq
import math
import time
import threading
import numpy as np
from collections import defaultdict
from nlsq import nlsq
from rssi import rssiToDistance, rssiToDistanceVariance
# from cache import getCache
from rawData import getEdges
from shapely.geometry import Point
from shapely.geometry.polygon import Polygon
# from vitals import getEdges
# from detectPoorVitals import sendRawRSSIPackets
# from aggregate import getEdges
from pprint import PrettyPrinter
from storeScale import getMeasuredPower, getLocation, getAnchors
from storePOI import getNavMesh, getPOI
import pdb
import collections
import operator
import copy
import sys

pp = PrettyPrinter(indent=2)

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

cache_loc         = getLocation()
cache_anchors = getAnchors()
cache_MP = getMeasuredPower()
history       = defaultdict(lambda: {})
neighbors = defaultdict(lambda: {})
filters = {}
final_edges = defaultdict(lambda: {})

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
  cache = getCache()
  print('loaded cache version', cache['version'])
  # requests.send_string(config['notifications']['cacheRequest'])
  # cache = requests.recv_json()
  # if cache and 'version' in cache:
    # print('loaded cache version', cache['version'])

####################################################################################
## Methods
####################################################################################

def convertDevice(receiverId):
  # print (receiverId)
  # print (cache_anchors[receiverId])
  return cache_anchors[receiverId]['device']['id']

def convertFromMAC(receiverId):
  for anchor, data in cache_anchors.items():
    if data['device']['id'] == receiverId:
      return anchor
  return False

def augmentGraph(edges, interval):
  global history
  # augment info
  rems = []
  for t in edges:
    # history[t]['distance'] = {}
    # history[t]['distance'][time] = {}
    for r in edges[t]:
      # print ("edges: ", r, t)
      # print (r, t)
      deviceid = convertDevice(r)
      # print (deviceid)
      # print (edges[t][r])
      # history[t]['distance'][time] = { str(r) : }
      try:
        # pdb.set_trace()
        # print (cache['devices'])
        # measuredPower = float(cache['devices'][t]['beacon']['measuredPower'])
        measuredPower = float(cache_MP[r]['measuredPower'])
        rssi          = float(edges[t][r]['mu'])
        sigma         = float(edges[t][r]['sigma'])
        period        = float(edges[t][r]['period'])
        location      = cache_loc[deviceid]['location']
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
        # print (edges[t][r])
        # print (t, r, location)
        # history[t]['distance'][time].update({
        #   r : distance
        # })
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
      raise

  # remove receivers not in the same map as the closest
  for (t, r) in rems:
    del edges[t][r]

  # print (history['b1'])
  
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
  nbrs_rssi = list(nbrsInfo.values())
  # for info in range(0, len(nbrs)):
  #   print (nbrs[info], nbrs_rssi[info]['rssi'])
  # print ("------------------------------------")

  # pdb.set_trace()
  _map        = nbrsInfo[nbrs[0]]['location']['map']
  # print ("map: ", _map)
  pos   = barycentric(
    n,
    nbrs,
    nbrsInfo
  )
  # print (pos)
  return {
    'map': _map,
    'latLng': pos,
    'lat': pos[1,0],
    'lng': pos[0,0]
  }

def calculateLocation(n, nbrsInfo):
  nbrs        = list(nbrsInfo.keys())
  #print(nbrs)
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
#   print(pos[0])
  return {
    'map': _map,
    'latLng': pos,
    'lat': pos[1],
    'lng': pos[0]
  }
  
  

def transmitterLocations(transmitters):
  return { t: calculateLocation(t, info) \
    for t, info in transmitters.items() \
    if cache_loc[t]['type'] == 'mobile' and info}

def sortDict(x):
  key = list(x.keys())
  return x[key[0]]['distance']

def findNearestNeighbors(transmitters):
  nearest = []
  result = {}
  for t, info in transmitters.items():
    anchorInfo = list(info.keys())
    if cache['devices'][t]['type'] == 'mobile' and info:
      for anchor in anchorInfo:
        # nearest.append({"anchor": anchor, "distance" : info[anchor]['distance'], "location": {"lat": info[anchor]["location"]["lat"], "lng": info[anchor]["location"]["lng"]}})
        nearest.append({anchor: {"distance" : info[anchor]['distance'], "location": {"map": info[anchor]["location"]["map"], "lat": info[anchor]["location"]["lat"], "lng": info[anchor]["location"]["lng"]}}})
      sorted_nearest = sorted(nearest, key=sortDict)
      for index in range(0, len(sorted_nearest)):
        key = list(sorted_nearest[index].keys())
        # if sorted_nearest[index][key[0]]['distance'] <= 5.0:
          # print (sorted_nearest[index])
        result.update(sorted_nearest[index])
      # print ("---------------------------")
    return { t: calculateLocationUsingNeighbors(t, result)}


def distance(a, b, scale):
  # print (a,b,scale)
  return scale * np.linalg.norm(a - b)

def checkDistances(distances, delta):
  for distance in distances:
    if distance > delta:
      return False
    else: return True

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

def checkBoundary(lng, lat, cache_mesh):
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

def shiftPtToSide(point, deviceId, cache_mesh):
  global history
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

def updateLocations(locations, transmitters, AR_delta, delta):
  global history
  updates = set()
  distances = set()
  for anchor, anchorData in transmitters['b1'].items():
    distances.add(anchorData["distance"])
  print (distances)
  for deviceId, location in locations.items():
    _map = location['map']
    cache_mesh = getNavMesh(_map['id'])
     # create if not exist
    if (deviceId not in history) or \
    (deviceId in history and \
    (deviceId == 'b1') and \
    checkDistances(distances, AR_delta) and \
    distance(location['latLng'], history[deviceId]['location']['latLng'], _map['scale']) > delta):
      # if True not in checkBoundary(location['latLng']):
      updates.add(deviceId)
    elif (deviceId not in history) or \
    (deviceId in history and \
    (deviceId != 'b1') and \
    distance(location['latLng'], history[deviceId]['location']['latLng'], _map['scale']) > delta):
      updates.add(deviceId)
    elif (deviceId in history and checkDistances(distances,AR_delta) == False): break
    inObstacle, pos = checkBoundary(location['lng'], location['lat'], cache_mesh)
    print (inObstacle)
    if True not in inObstacle:
      shiftedPos = shiftPtToSide(pos, deviceId, cache_mesh)
      history[deviceId].update({
          'location': {
            'map': _map,
            'latLng': shiftedPos,
            'lat': shiftedPos[1],
            'lng': shiftedPos[0]
          },
          'inPolygon': False,
          # 'direction': direction
      })
    else:
      # update history
      history[deviceId].update({
        'location': {
          'map': _map,
          'latLng': location['latLng'],
          'lat': location['lat'],
          'lng': location['lng']
        },
        'inPolygon': True,
        'polygon': inObstacle.index(True)
      })
  return updates

def filterRSSI(edges, alpha):
  f = {}
  for beaconid, data in edges.items():
    for anchorid, rssiData in edges[beaconid].items():
      # print (anchorid, rssiData)
      if beaconid not in filters:
        filters[beaconid] = { anchorid: {
          'mu': rssiData['rssi'],
          'sigma': 1000,
          'lastUpdate': rssiData['time'],
          'period': 1000,
          'alpha': 0.05,
          'beaconid': beaconid,
          'receiverId': anchorid
        }}
      elif beaconid in filters and anchorid not in filters[beaconid]: 
        filters[beaconid][anchorid] = { 
          'mu': rssiData['rssi'],
          'sigma': 1000,
          'lastUpdate': rssiData['time'],
          'period': 1000,
          'alpha': 0.05,
          'beaconid': beaconid,
          'receiverId': anchorid
        }
      else: 
        f = copy.deepcopy(filters[beaconid][anchorid])
        #mean, variance calculation
        diff = rssiData['rssi'] - f['mu']
        incr = f['alpha'] * diff
        f['mu'] += incr
        f['sigma'] = (1-f['alpha']) * (f['sigma']+(diff *incr))
        #period calculation
        diff = rssiData['time'] - f['lastUpdate'] - f['period']
        incr = 0.01*diff
        f['period'] += incr
        f['lastUpdate'] = rssiData['time']
        #adapt alpha
        if f['period'] >1000:
          f['alpha']= 0.2
        else:
          f['alpha'] = (f['period']*0.0001667) + 0.0333
  #       print (f)
        filters[beaconid][anchorid].update({
          'mu': f['mu'],
          'sigma': f['sigma'],
          'period': f['period'],
          'lastUpdate': f['lastUpdate']   
          })
  # print (filters['b2']['b827eb0827cf'], filters['b2']['b827ebc26413'])
  return filters

def arrangeEdges(filters):
  for key, data in filters.items():
    for anchor, beacondata in filters[key].items():
      filtered_edges = {
        'transmitterId': key,
        'receiverId': beacondata['receiverId'],
        'mu': beacondata['mu'],
        'sigma': beacondata['sigma'],
        'period': beacondata['period']
      }
      receiverId = beacondata['receiverId']
      # update
      if key in final_edges and receiverId in final_edges[key]:
        final_edges[key][receiverId].update(filtered_edges)
      else:
        # create
        final_edges[key].update({
                receiverId: filtered_edges
              })
  return copy.deepcopy(final_edges)

def processEdges(interval, alpha):
  edges         = getEdges()
  # print ("edges_original: ", edges['b2']['b827eb0827cf']['rssi'], edges['b2']['b827ebc26413']['rssi'])
  try:
    filters = filterRSSI(edges, alpha)
    # print ("filtered..." , filters['b2']['b827eb0827cf']['mu'], filters['b2']['b827ebc26413']['mu'])
    new_edges = arrangeEdges(filters)
    # pdb.set_trace()
    # print ("final: ", new_edges)
    transmitters  = augmentGraph(new_edges, interval)
    # print ("transmitters........: ", transmitters['b6'].keys())
    now           = int(time.time() * 1000)
    # print ("transmitters...: ", transmitters['b7'][convertFromMAC(sys.argv[2])]['rssi'], transmitters['b7'][convertFromMAC(sys.argv[2])]['distance'])
  except:
    raise
    
  # print (edges)
  # print (transmitters['b2'])
  # try:
    # print (transmitters['b2'])
    # print (transmitters['b2']['b827ebc26413']['rssi'])
    # print ("rpi4", transmitters['b2']['b827ebc26413']['rssi'], transmitters['b2']['b827ebc26413']['distance'])
    # print ("rpi14", transmitters['b2']['b827eb9cd770']['rssi'], transmitters['b2']['b827eb9cd770']['distance'])
    # print ("rpi10", transmitters['b2']['b827eb3f8951']['rssi'], transmitters['b2']['b827eb3f8951']['distance'])
  # except:
  #   pass  
  try:
    # locations = findNearestNeighbors(transmitters)
    locations     = transmitterLocations(transmitters)
    updates       = updateLocations(locations, transmitters, AR_delta=2.5, delta=0)
    print ("updates..........: ", updates)

    for deviceId in updates:
      topic = config['notifications']['positionUpdate']
      message = json.dumps({
        'id':     deviceId,
        'lng':    history[deviceId]['location']['lng'],
        'lat':    history[deviceId]['location']['lat'], 
        'map':    history[deviceId]['location']['map'],
        # 'neighbors': neighbors[deviceId]['neighbors'],
        # 'distance': history[deviceId]['distance'],
        'time':   now
      })
      # print (message)
      # print ("Out of obstacle")
      print ("Sending Position Data...")
      print(message)
      notify.send_multipart([topic.encode('utf-8'), message.encode('utf-8')])
  except:
    raise

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
  alpha = float(0.2)
  while True:
    time.sleep(interval)
    try:
      processEdges(interval*1000, alpha)
    except:
      raise

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
