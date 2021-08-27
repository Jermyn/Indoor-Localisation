from rawData import getEdges
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
from measureAnchorDist import anchorBeaconComparison

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
receiverList = ['E15', 'Bed2', 'A2', 'C4', 'Bed4', 'Bed10', 'E14']
receiverList2 = ['15', 'Ward1_Bed2', 'Ward2_Bed1', 'Corridor4', 'Ward2_Bed4', 'Bed_10', '14']
include_id = 0
include_curr = 0

cache = getCache()
# print (cache)
avgRSSIFile = open('avgRSSI_beaconCal1_Jermyn.csv', 'a')
# avgRSSIFile.write("anchorID, TransmitterID, ")
# for i in range(int(int(sys.argv[1])/500)): avgRSSIFile.write(str(i+1) + ", ")
# avgRSSIFile.write("Avg, Distance\n")

def storeDistance(receiver):
  global devices, cache
  anchorId, dist = anchorBeaconComparison(receiver, sys.argv[2])
  strDev = anchorId + ", " + str(dist)
  devices.append(strDev.split(", "))
  devices[0][1] = float(("{0:.2f}".format(float(devices[0][1]))))


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

      ###################### beacon calibration version ##############################################
      avgRSSI.append(edges[beaconDev][dev[0]]['rssi'])##argument2:beaconId, argument3:anchorid
      avgRSSIFile.write(str(edges[beaconDev][dev[0]]['rssi']) + ", ")
      print ("RSSI: %.2f" % (float("{0:.2f}".format(edges[beaconDev][dev[0]]['rssi']))) + ", " + dev[0]) 
    else:
      meanRSSI = mean(avgRSSI)
      avgRSSIFile.write(str(meanRSSI) + ", " + str(dev[1]) + "\n")
      print ("Average RSSI: %.2f" % (float("{0:.2f}".format(meanRSSI))) + ", " + dev[0])
      # measuredPower = getMeasuredPower(meanRSSI, float(sys.argv[4]))##argument4: distance
      avgRSSI = []
  except:
    pass
  return progress

###################### beacon calibration version ##############################################
def mainBVers(receiver):
  interval = 0.5
  progress = 0
  startTime = int(time.time()*1000)
  avgRSSIFile.write(str(receiver) + ", " + str(devList[0]) + ", " + sys.argv[2] + ", ")
  while progress < 100:
    time.sleep(interval)
    try:
      print (devices[0])
      progress = processEdges(interval*1000, startTime, devices[0], devList[0])
      print (progress)
    except:
      raise
    
# updateCache()


###################### anchor calibration version ##############################################
def runMainAVers():
  for index_currDev in range(len(devices)):
    if index_currDev == 0:
      main(index_currDev)
    else:
      if input("Enter the enter key to start the next device...") == '':
        main(index_currDev)

###################### beacon calibration version ##############################################
def runMainBVers():
  global receiverList, receiverList2, devices
  for receiverIndex in range(len(receiverList)):
    storeDistance(receiverList2[receiverIndex])
    if receiverIndex == 0:
      mainBVers(receiverList[receiverIndex])
    else:
      if input("Enter the enter key to start the next device...") == '':
        mainBVers(receiverList[receiverIndex])
    devices = []
runMainBVers()