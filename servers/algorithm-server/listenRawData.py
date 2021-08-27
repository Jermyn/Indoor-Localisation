import json, zmq
from collections import defaultdict
from rx import Observable, Observer
from rx.core import Scheduler
import time
import copy
import pprint
pp = pprint.PrettyPrinter(indent=2)

# config
config = None
with open('../config.json', 'r') as f:
  config = json.load(f)

# zmq
beaconData = zmq.Context().socket(zmq.PULL)
beaconData.setsockopt(zmq.SNDHWM, 10000)
beaconData.bind(config['zmqSockets']['sms']['pushpull'])

# while True:
#   print ("Waiting for data to stream...")
#   data = beaconData.recv_json()
#   print (data)
#   if data['receiverId'] == '103':
#     print(beaconData.recv_json())
  # if data['receiverId'] == '' and data['transmitterId'] == 'b2':
  #   print (data)

# state
edges = defaultdict(lambda: {})

def beaconObservable (observer):
  while True:
    data = beaconData.recv_json()
    observer.on_next(data)

def subscribe (xss):
  global edges
  now = int(time.time() * 1000)
  # update edges
  for x in xss:
    if all(k in x for k in ['gattid', 'anchorId']):
      x['updatedAt'] = now
      if x['gattid'] in edges and x['anchorId'] in edges[x['gattid']]:
        # update
        edges[x['gattid']][x['anchorId']].update(x)
      else:
        # create
        x['createdAt'] = now
        edges[x['gattid']].update({
          x['anchorId']: x
        })

# def subscribe (xss):
#   global edges
#   now = int(time.time() * 1000)
#   # update edges
#   for xs in xss:
#     # for x in xs:
#     if all(k in xs for k in ['transmitterId', 'receiverId']):
#       xs['updatedAt'] = now
#       if xs['transmitterId'] in edges and xs['receiverId'] in edges[xs['transmitterId']]:
#         # update
#         edges[xs['transmitterId']][xs['receiverId']].update(xs)
#       else:
#         # create
#         xs['createdAt'] = now
#         edges[xs['transmitterId']].update({
#           xs['receiverId']: xs
#         })

#   #expire edges
#   rms = []
#   for t in edges:
#     for r in edges[t]:
#       # print (edges[t][r])
#       try:
#         # print (edges[t][r]['transmitterId'], "sending")
#         if now - edges[t][r]['updatedAt'] > 3000 + 10 * edges[t][r]['period']:
#           rms.append((t,r))
#       except:
#         # print (edges[t][r]['transmitterId'], "failed")
#         continue
#   for t,r in rms:
#     del edges[t][r]

Observable.create(beaconObservable) \
.subscribe_on(Scheduler.new_thread) \
.buffer_with_time(500) \
.subscribe(on_next=subscribe)

# export
def getEdges():
  return copy.deepcopy(edges)