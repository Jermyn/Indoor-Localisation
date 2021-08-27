import json
import zmq

# config
config = None
with open('../config.json', 'r') as f:
  config = json.load(f)

# zmq
requester = zmq.Context().socket(zmq.REQ)
requester.connect(config['zmqSockets']['broker']['router'])

# export
def getCache():
  requester.send_string(config['notifications']['cacheRequest'])
  return requester.recv_json()
getCache()