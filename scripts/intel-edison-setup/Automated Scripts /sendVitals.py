# import pyrebase
import json, zmq
from collections import defaultdict
from rx import Observable, Observer
from rx.core import Scheduler
import time
import copy

config  = None
with open('../config.json', 'r') as f:
  config = json.load(f)
print(config['zmqSockets']['firebase']['pushpull'])
# Firebase config
# firebaseConfig = {
#     "apiKey" :  "AIzaSyBhkxSRwaNi0JxGMiH_1eXITpz602Hvqp8",
#     "authDomain" :  "medicalportal-62857.firebaseapp.com",
#     "databaseURL": "https://medicalportal-62857.firebaseio.com",
#     "projectId": "medicalportal-62857",
#     "storageBucket": "",
#     "messagingSenderId": "210169025710",
# }

# firebase = pyrebase.initialize_app(config)

# auth = firebase.auth()
# #authenticate a user
# user = auth.sign_in_with_email_and_password("admin@admin.com", "password")
# db = firebase.database()

vitalData = zmq.Context().socket(zmq.PULL)
vitalData.setsockopt(zmq.SNDHWM, 10000)
vitalData.bind(config['zmqSockets']['firebase']['pushpull'])

# state
edges = defaultdict(lambda: {})

def beaconObservable (observer):
  while True:
    data = vitalData.recv_json()
    observer.on_next(data)

def subscribe (xss):
  global edges
  now = int(time.time() * 1000)
  # update edges
  for x in xss:
    if all(k in x for k in ['gattid', 'anchorId']):
      x['updatedAt'] = now
      if x['gattid'] in edges and x['anchorId'] in edges:
        # update
        edges.update(x)
      else:
        # create
        x['createdAt'] = now
        edges.update(x)


Observable.create(beaconObservable) \
.subscribe_on(Scheduler.new_thread) \
.buffer_with_time(500) \
.subscribe(on_next=subscribe)

# export
def getEdges():
  return copy.deepcopy(edges)