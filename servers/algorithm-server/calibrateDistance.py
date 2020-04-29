from cache import getCache
from listenRawData import getEdges
import json
import sys
import zmq
from statistics import mean, pstdev
from rssi import getMeasuredPower, getOffset, rssiToDistance
import threading
import time
import csv, operator
import math
from storeScale import getScale

cache         = {}
avgRSSI     = []
anchorIndex = 0
data = []
total = 0
avg = 0
dist = 0
flag = 0
curr_device = ""
devices = []
devList = ['b2']
include_id = 0
include_curr = 0

avgRSSIFile = open('avgRSSI_beaconCal1_Jermyn.csv', 'a')
# avgRSSIFile.write("anchorID, TransmitterID, ")
# for i in range(int(int(sys.argv[1])/500)): avgRSSIFile.write(str(i+1) + ", ")
# avgRSSIFile.write("Avg, Distance\n")


def updateCache():
  global cache
  cache = getCache()  
  print('loaded cache version', cache['version'])

def determineDistance(transmitterPos, receiverPos):
  return math.sqrt((float(transmitterPos[0]) - float(receiverPos[0])) **2 + ((float(transmitterPos[1]) - float(receiverPos[1])) **2)) * getScale('actlab_test')

def findNearbyAnchors(transmitterId):
  global devices
  transmitterPos = []
  receiverPos = []
  for key, val in cache['anchors'].items():
    if cache['anchors'][key]['device']['location'] != None:
      if cache['anchors'][key]['device']['location']['map']['id'] == 'actlab_test':
        if cache['anchors'][key]['device']['id'] == transmitterId:
          transmitterPos = [cache['anchors'][key]['device']['location']['lat'], cache['anchors'][key]['device']['location']['lng']]
          break
  for key, val in cache['anchors'].items():
    if cache['anchors'][key]['device']['location'] != None:
      if cache['anchors'][key]['device']['location']['map']['id'] == 'actlab_test':
        if cache['anchors'][key]['device']['id'] != transmitterId:
          receiverPos = [cache['anchors'][key]['device']['location']['lat'], cache['anchors'][key]['device']['location']['lng']]
          receiverId = cache['anchors'][key]['device']['id']
          if determineDistance(transmitterPos, receiverPos) < 100:
            devices.append([receiverId, determineDistance(transmitterPos, receiverPos)])

def processEdges(interval, startTime, dev, beaconDev):
  global avgRSSI
  i = 0
  edges         = getEdges()
  # print (edges)
  now           = int(time.time() * 1000)
  progress = int(((now-startTime)/int(sys.argv[1]))*100)
  try:
    if (now - startTime) < int(sys.argv[1]):##argument1:duration
      # avgRSSI += edges[sys.argv[2]][dev]['rssi']
      
      ###################### anchor calibration version ##############################################
      avgRSSI.append(edges[beaconDev][sys.argv[2]]['rssi'])##argument2:beaconId, argument3:anchorid
      avgRSSIFile.write(str(edges[beaconDev][sys.argv[2]]['rssi']) + ", ")
      print ("RSSI: %.2f" % (float("{0:.2f}".format(edges[beaconDev][sys.argv[2]]['rssi'])))) 
    else:
      meanRSSI = mean(avgRSSI)
      avgRSSIFile.write(str(meanRSSI) + ", " + str(dev[1]) + "\n")
      print ("Average RSSI: %.2f" % (float("{0:.2f}".format(meanRSSI))))
      # measuredPower = getMeasuredPower(meanRSSI, float(sys.argv[4]))##argument4: distance
      avgRSSI = []
  except:
    pass
  return progress

###################### anchor calibration version ##############################################
def main(devIndex):
  interval = 0.5
  progress = 0
  startTime = int(time.time()*1000)
  avgRSSIFile.write(str(sys.argv[2]) + ", ")
  avgRSSIFile.write(str(devices[devIndex][0]) + ", ")
  while progress < 100:
    time.sleep(interval)
    try:
      if devIndex == 0:
        progress = processEdges(interval*1000, startTime, devices[devIndex], devList[devIndex])
        print (progress)
      else:
        progress = 0
        progress = processEdges(interval*1000, startTime, devices[devIndex], devList[devIndex])
        print (progress)
    except:
      raise

###################### anchor calibration version ##############################################
def runMainAVers():
  for index_currDev in range(len(devices)):
    if index_currDev == 0:
      main(index_currDev)
    else:
      if input("Enter the enter key to start the next device...") == '':
        main(index_currDev)
