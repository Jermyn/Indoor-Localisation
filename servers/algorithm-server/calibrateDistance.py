### arg 1: duration, arg 2: beaconid
# from rawData import getEdges
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
from cache_local import getCache

cache         = getCache()
avgRSSI     = []
anchorIndex = 0
data = []
total = 0
avg = 0
dist = 0
flag = 0
curr_device = ""
devices = {}
include_id = 0
include_curr = 0
mapname = 'actlab'

# avgRSSIFile = open('avgRSSI_beaconCal1_Jermyn.csv', 'a')
# avgRSSIFile.write("anchorID, TransmitterID, ")
# for i in range(int(int(sys.argv[1])/500)): avgRSSIFile.write(str(i+1) + ", ")
# avgRSSIFile.write("Avg, Distance\n")

def determineDistance(transmitterPos, receiverPos, mapname):
  return math.sqrt((float(transmitterPos[0]) - float(receiverPos[0])) **2 + ((float(transmitterPos[1]) - float(receiverPos[1])) **2)) * getScale(mapname)

def findNearbyAnchors(anchor, mapname):
  transmitterPos = []
  receiverPos = []
  sorted_devices = {}
  temp = {}
  tempDict = {}
  # for anchor in anchorList:
  for key, val in enumerate(cache['anchors']):
    if cache['anchors'][key]['device']['location'] != 'null':
      if cache['anchors'][key]['device']['location']['map']['id'] == mapname:
        if cache['anchors'][key]['device']['id'] == anchor:
          transmitterPos = [cache['anchors'][key]['device']['location']['lat'], cache['anchors'][key]['device']['location']['lng']]
          break
  for key, val in enumerate(cache['anchors']):
    if cache['anchors'][key]['device']['location'] != 'null':
      if cache['anchors'][key]['device']['location']['map']['id'] == mapname:
        if cache['anchors'][key]['device']['id'] != anchor:
          receiverPos = [cache['anchors'][key]['device']['location']['lat'], cache['anchors'][key]['device']['location']['lng']]
          receiverId = cache['anchors'][key]['device']['id']
          if determineDistance(transmitterPos, receiverPos, mapname) < 5:
            try:
              devices[anchor].update({receiverId: determineDistance(transmitterPos, receiverPos, mapname)})
            except KeyError:
              devices[anchor] = {
                receiverId: determineDistance(transmitterPos, receiverPos, mapname)
              }
  temp = dict(sorted(devices[anchor].items(), key=lambda item: item[1]))
  temp_items = temp.items()
  try:
    tempDict[anchor].update(dict(list(temp_items)[:2]))
  except KeyError:
    tempDict[anchor] = dict(list(temp_items)[:2])
  return tempDict

def storeAllDevices(mapname):
  devList = []
  for key, val in enumerate(cache['anchors']):
    if cache['anchors'][key]['device']['location'] != 'null':
      if cache['anchors'][key]['device']['location']['map']['id'] == mapname:
        devList.append(cache['anchors'][key]['device']['id'])
  return devList

def processEdges(interval, startTime, dev, beaconDev):
  global avgRSSI
  i = 0
  edges         = getEdges()
  print (edges)
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
def main(anchor, anchorData):
  interval = 0.5
  progress = 0
  startTime = int(time.time()*1000)
  # avgRSSIFile.write(str(anchor) + ", ")
  # avgRSSIFile.write(str(devices[devIndex][0]) + ", ")
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
def runMainAVers(sorted_devices):
  for curr_dev, value in sorted_devices.items():
    main(curr_dev, value)
    # else:
    #   if input("Enter the enter key to start the next device...") == '':
    #     main(index_currDev)
# runMainAVers()
anchorList = storeAllDevices(mapname)
sorted_devices = findNearbyAnchors(sys.argv[2], mapname)
# runMainAVers(sorted_devices)
print (sorted_devices)
