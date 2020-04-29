from listenRawData import getEdges
import time
import sys
from rssi import rssiToDistance, rssiToDistanceVariance
from storeScale import getMeasuredPower

while True:
  time.sleep(0.5)
  edges = getEdges()
  try:
    rssi = edges[sys.argv[1]][sys.argv[2]]['rssi']
    MP = getMeasuredPower(sys.argv[2])
    distance = rssiToDistance(rssi, MP)
    print (rssi, distance)
  except:
    pass
  