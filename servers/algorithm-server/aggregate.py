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
beaconData.bind(config['zmqSockets']['beaconData']['pushpull'])

# state
edges = defaultdict(lambda: {})
while True:
    data = beaconData.recv_json()
    print (data)

# def beaconObservable (observer):
#   while True:
#     data = beaconData.recv_json()
#     observer.on_next(data)

# def subscribe (xss):
#   global edges
#   now = int(time.time() * 1000)
#   # update edges
#   for xs in xss:
#     for x in xs:
#       if all(k in x for k in ['transmitterId', 'receiverId']):
#         x['updatedAt'] = now
#         if x['transmitterId'] in edges and x['receiverId'] in edges[x['transmitterId']]:
#           # update
#           edges[x['transmitterId']][x['receiverId']].update(x)
#         else:
#           # create
#           x['createdAt'] = now
#           edges[x['transmitterId']].update({
#             x['receiverId']: x
#           })

#   # expire edges
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

# Observable.create(beaconObservable) \
# .subscribe_on(Scheduler.new_thread) \
# .buffer_with_time(500) \
# .subscribe(on_next=subscribe)

# # export
# def getEdges():
#   return copy.deepcopy(edges)