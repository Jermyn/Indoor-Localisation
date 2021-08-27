# from cache import getCache
from listenRawData import getEdges
from postgres import connectDatabase, fetchAnchorData, inputAnchorData
# from aggregate import getEdges
import json
import sys
import zmq
from statistics import mean, pstdev
from rssi import getMeasuredPower, getOffset, rssiToDistance
import threading
import time

####################################################################################
## REDIS, ZMQ
####################################################################################

# config  = None
# with open('../config.json', 'r') as f:
#   config = json.load(f)

# notifications = zmq.Context().socket(zmq.SUB)
# notifications.setsockopt_string(zmq.SUBSCRIBE, config['notifications']['cacheUpdate'])
# notifications.connect(config['zmqSockets']['broker']['xpub'])

# notify = zmq.Context().socket(zmq.PUB)
# notify.connect(config['zmqSockets']['broker']['xsub'])

####################################################################################
## State
####################################################################################

# cache         = {}
avgRSSI     = None
meanRSSI1 = 0
meanRSSI2 = 0
meanRSSI = 0
# mode = 1
conn = connectDatabase()

def updateCache():
  global cache
  cache = getCache()  
  print('loaded cache version', cache['version'])

def processEdges(interval, startTime, run):
  global avgRSSI, measuredPower, meanRSSI, conn
  i = 0
  measuredPower = 0
  edges         = getEdges()
  print (edges[sys.argv[2]][sys.argv[3]])
  now           = int(time.time() * 1000)
  progress = int(((now-startTime)/int(sys.argv[1]))*100)
  try:
    if (now - startTime) < int(sys.argv[1]):##argument1:duration
      if avgRSSI == None:
        avgRSSI = edges[sys.argv[2]][sys.argv[3]]['rssi']
      else:
        # avgRSSI = 0.01 * edges[sys.argv[2]][sys.argv[3]]['rssi'] + 0.99 * avgRSSI
      # print ("Average RSSI: %.2f" % (float("{0:.2f}".format(avgRSSI))))
      avgRSSI.append(edges[sys.argv[2]][sys.argv[3]]['rssi'])##argument2:beaconId, argument3:anchorid
    else:
      # print ("MeasuredPower: %.2f" % (float("{0:.2f}".format(avgRSSI))))
      # inputAnchorData(conn, sys.argv[3], float("{0:.2f}".format(avgRSSI)))
      # fetchAnchorData(conn, sys.argv[3])
      # conn.close()
      # avgRSSI = None
      meanRSSI = mean(avgRSSI)
      measuredPower = getMeasuredPower(meanRSSI, float(sys.argv[4]))##argument4: distance
      avgRSSI = []
      print (measuredPower)
  except:
    pass
  return progress

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


def main(run):
  interval = 0.5
  progress = 0
  mode = 1
  startTime = int(time.time()*1000)
  while progress < 100:
    time.sleep(interval)
    try:
      if run == 1:
        progress = processEdges(interval*1000, startTime, run)
        print (progress)
      elif run == 2:
        progress = 0
        progress = processEdges(interval*1000, startTime, run)
        print (progress)
    except:
      raise

  # sys.exit(0)
  # if run == 2:
  #   print (meanRSSI1, meanRSSI2)
  #   offset = getOffset(float(sys.argv[5]), float(sys.argv[4]), float(meanRSSI1), float(meanRSSI2))##5th argument is initial distance
  #   MP = getMeasuredPower(meanRSSI1, float(sys.argv[5]))
  #   Distance = rssiToDistance(meanRSSI2, meanRSSI1)
  #   MPOffset = MP + float(offset)
  #   DistanceOffset = rssiToDistance(float(meanRSSI2 - offset), MPOffset)
  #   print (offset)
  #   print ("MeasuredPower: " + str(float("{0:.2f}".format(MP))))
  #   print ("Measured Distance: " + str(float("{0:.2f}".format(Distance))))
  #   print ("MeasuredPower with offset: " + str(float("{0:.2f}".format(MPOffset))))
  #   print ("Measured Distance with offset: " + str(float("{0:.2f}".format(DistanceOffset))))
  #   sys.exit(0)

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
run = 1
noOfTries = 2
while run <= int(noOfTries):
  if run == 1:
    main(run)
  if run == 2:
    if raw_input("Enter the enter key to start the second testing...") == '':
      main(run)
  run+=1