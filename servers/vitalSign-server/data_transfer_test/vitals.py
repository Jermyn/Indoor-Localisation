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
# gatt = {
#         'c03845fd61f2':'pox0',
#         'pox0':'pox0',
#         'f32d732ef72c':'pox1',
#         'pox1':'pox1',
#         'e9d88a345bdf':'pox2',
#         'pox2':'pox2',
#         'faa54c2f56da':'pox3',
#         'pox3':'pox3',
#         'c8eef2af4d6b':'pox4',
#         'pox4':'pox4',
#         'ea2e9031910f':'pox5',
#         'pox5':'pox5',
#         'fe24d49a720f':'pox6',
#         'pox6':'pox6',
#         'e1817c079bee':'pox7',
#         'pox7':'pox7',
#         'eedba2717618':'pox8',
#         'pox8':'pox8',
#         'f13f78592431':'pox9',
#         'pox9':'pox9',
#         'f5be915ef451':'pox10',
#         'pox10':'pox10',
#         'd09c01a81f9f':'pox11',
#         'pox11':'pox11',
#         'ead70333a309':'pox12',
#         'pox12':'pox12',
#         'cd8797dce9c7':'pox13',
#         'pox13':'pox13',
#         'fc4007fa8b79':'pox14',
#         'pox14':'pox14',
#         'f044cab12ac3':'pox15',
#         'pox15':'pox15',
#         'e26140d67c5f':'pox16',
#         'pox16':'pox16',
#         'e25864f9de0d':'pox17',
#         'pox17':'pox17',
#         'd975b0c30e67':'pox18',
#         'pox18':'pox18',
#         'f646bdf64ab7':'pox19',
#         'pox19':'pox19',
#         'd31da0671289':'pox20',
#         'pox20':'pox20',
#         'fc6b721c7b56':'pox21',
#         'pox21':'pox21',
#         'ca564105d715':'pox22',
#         'pox22':'pox22',
#         'e689f853ef15':'pox23',
#         'pox23':'pox23',
#         'd55f1f3673f0':'pox24',
#         'pox24':'pox24',
#         'dbd6da6ef8b7':'pox25',
#         'pox25':'pox25',
#         'ca96a4a2d45d':'pox26',
#         'pox26':'pox26',
#         'ce0395cb7bc4':'pox27',
#         'pox27':'pox27'
# }


# zmq
vitals = zmq.Context().socket(zmq.PULL)
vitals.setsockopt(zmq.SNDHWM, 10000)
vitals.bind(config['zmqSockets']['sms']['pushpull'])

# state
edges = defaultdict(lambda: {})

def vitalObservable (observer):
  while True:
    data = vitals.recv_json()
#     # data['gattid'] = gatt[data['gattid']]
    observer.on_next(data)

def subscribe (xss):
  global edges
  now = int(time.time() * 1000)
  # update edges
  for x in xss:
    if all(k in x for k in ['gattid', 'anchorId']):
      x['updatedAt'] = now
      if x['gattid'] in edges:
        # update
        edges[x['gattid']].update(x)
      else:
        # create
        x['createdAt'] = now
        edges[x['gattid']].update(x)

  # expire edges
  # rms = []
  # for t in edges:
  #   for r in edges[t]:
  #     print (edges[t][r])
  #     try:
  #       # print (edges[t][r]['transmitterId'], "sending")
  #       if now - edges[t][r]['updatedAt'] > 3000 + 10 * edges[t][r]['period']:
  #         rms.append((t,r))
  #     except:
  #       # print (edges[t][r]['transmitterId'], "failed")
  #       continue
  # for t,r in rms:
  #   del edges[t][r]

Observable.create(vitalObservable) \
.subscribe_on(Scheduler.new_thread) \
.buffer_with_time(500) \
.subscribe(on_next=subscribe)

# export
def getEdges():
  return copy.deepcopy(edges)