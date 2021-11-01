### arg 1: duration, arg 2: beaconid
from listenRawData import getEdges
import json
import sys
import zmq
import copy
import re
from statistics import mean, pstdev
from collections import defaultdict
# from rssi import getMeasuredPower, getOffset, rssiToDistance
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
result_dict = {}
final_edges = defaultdict(lambda: {})
rssi_result = []
write_state = [0,0]

avgRSSIFile = open('calibrate_Anchors_Distance_3.csv', 'a')
# avgRSSIFile.write("TransmitterID, AnchorID ")
# for i in range(int(int(sys.argv[1])/1000)): avgRSSIFile.write(str(i+1) + ", ")
# avgRSSIFile.write("Avg, Distance\n")

def readFile(filename):
  f = open(filename)
  data = json.load(f)
  f.close()
  return data

def convertDevice(receiverId):
  res = defaultdict(lambda:{})
  for key, val in enumerate(cache['anchors']):
    res[val['id']].update(val)
  return res[receiverId]['device']['id']

def formatEdges(edges):
  for t in edges:
    for r in edges[t]:
      edges[t][r] = {
        'rssi': edges[t]['rssi']
      }
  return edges

def arrangeEdges(edges, anchors):
  for key, anchor in edges.items():
    for key_anchor, data in edges[key].items():
      # formatted_edges = {
      #   'transmitterId': key,
      #   'receiverId': data['anchorId'],
      #   'rssi': data['rssi']
      # }
      receiverId = convertDevice(key_anchor)
      final_edges[key][receiverId] = {
        'transmitterId': key,
        'receiverId': data['anchorId'],
        'rssi': data['rssi']
      }
    # receiverId = data['anchorId']
    # print (filtered_edges)
    # update
      # if key in final_edges and receiverId in final_edges[key]:
      #   final_edges[key][receiverId].update(formatted_edges)
      # else:
      #   # create
      #   final_edges[key].update({
      #           receiverId: formatted_edges
      #         })
  return final_edges

def determineDistance(transmitterPos, receiverPos, mapname):
  return math.sqrt((float(transmitterPos[0]) - float(receiverPos[0])) **2 + ((float(transmitterPos[1]) - float(receiverPos[1])) **2)) * getScale(mapname)

def determineSamePlane(transmitterPos, receiverPos):
  formatted_lat_transmitter = float("{0:.3f}".format(transmitterPos[0]))
  formatted_lng_transmitter = float("{0:.3f}".format(transmitterPos[1]))
  formatted_lat_receiver = float("{0:.3f}".format(receiverPos[0]))
  formatted_lng_receiver = float("{0:.3f}".format(receiverPos[1]))
  # print(formatted_lat_transmitter, formatted_lng_transmitter, formatted_lat_receiver, formatted_lng_receiver)
  if (formatted_lat_transmitter == formatted_lat_receiver) or (formatted_lng_transmitter == formatted_lng_receiver):
    return True
  return False


def findNearbyAnchors(anchor, mapname, distances):
  sorted_devices = {}
  temp = {}
  tempDict = {}
  transmitterPos = []
  receiverPos = []
  for key, val in enumerate(distances):
    if (val != anchor):
      receiverId = val
      if receiverId in distances[anchor]:
      #   for anchorKey, anchorVal in enumerate(cache['anchors']):
      #     if anchorVal["device"]["id"] == anchor:
      #       transmitterPos =  [anchorVal["device"]["location"]["lat"], anchorVal["device"]["location"]["lng"]]
      #     if anchorVal["device"]["id"] == receiverId:
      #       receiverPos = [anchorVal["device"]["location"]["lat"], anchorVal["device"]["location"]["lng"]]
      #     if len(transmitterPos) > 0 and len(receiverPos) > 0:
      #       break
        # print(transmitterPos, receiverPos, anchorVal["device"]["id"])
        # if determineSamePlane(transmitterPos, receiverPos) == False:
        # if distances[anchor][receiverId] < 6:
        try:
          devices[anchor].update({receiverId: distances[anchor][receiverId]})
        except KeyError:
          devices[anchor] = {
            receiverId: distances[anchor][receiverId]
          }
  temp = dict(sorted(devices[anchor].items(), key=lambda item: item[1]))
  temp_items = list(temp.items())
  for item in temp_items:
    try:
      tempDict[anchor].update(dict({item[0]: { 'distance': item[1] }}))
    except KeyError:
      tempDict[anchor] = {
        item[0]: { 'distance': item[1] }
      }
  return tempDict

def storeAllDevices(mapname):
  devList = []
  for key, val in enumerate(cache['anchors']):
    if cache['anchors'][key]['device']['location'] != 'null':
      if cache['anchors'][key]['device']['location']['map']['id'] == mapname:
        devList.append(cache['anchors'][key]['device']['id'])
  return devList

def writeToFile(beacon, anchor, rssiList, avgRSSIFile, meanRSSI, distance):
  avgRSSIFile.write(str(beacon) + ", " + str(anchor) + ", ")
  for i in rssiList:
    avgRSSIFile.write(str(i) + ", ")
  avgRSSIFile.write(str(meanRSSI) + ", " + str(distance) + "\n")

def appendRSSIList(rssi, anchorDict):
  if 'raw-rssi' in anchorDict:
    anchorDict['raw-rssi'].append(rssi)
  else:
    anchorDict['raw-rssi'] = [rssi]

def processEdges(interval, startTime, beacon, anchorData, beaconID):
  global avgRSSI, result_dict
  i = 0
  edges         = getEdges()
  anchors = list(anchorData.keys())
  transmitters = arrangeEdges(edges, anchors)
  # print (transmitters['b12']['rpi9'])
  now           = int(time.time() * 1000)
  progress = int(((now-startTime)/int(sys.argv[1]))*100)
  try:
    if (now - startTime) < int(sys.argv[1]):##argument1:duration
      # avgRSSI += transmitters[beacon][anchors[0]]['rssi']
      ###################### anchor calibration version ##############################################
      for anchor in anchors:
        temp_rssi = transmitters[beaconID][anchor]['rssi']
        # temp_rssi_2 = transmitters[beaconID][anchors[1]]['rssi']
        # appendRSSIList(temp_rssi_1, result_dict[beacon][anchors[0]])
        appendRSSIList(temp_rssi, result_dict[beacon][anchor])
        print ("RSSI of " + str(anchor + ": %.2f" % (float("{0:.2f}".format(temp_rssi)))))
        # print ("RSSI of " + str(anchors[1] + ": %.2f" % (float("{0:.2f}".format(temp_rssi_2)))))
    else:
      for anchor in anchors:
        meanRSSI = mean(result_dict[beacon][anchor]['raw-rssi'])
        # meanRSSI_2 = mean(result_dict[beacon][anchors[1]]['raw-rssi'])
        # writeToFile(beacon, anchors[0], result_dict[beacon][anchors[0]]['raw-rssi'], avgRSSIFile, meanRSSI_1, result_dict[beacon][anchors[0]]['distance'])
        writeToFile(beacon, anchor, result_dict[beacon][anchor]['raw-rssi'], avgRSSIFile, meanRSSI, result_dict[beacon][anchor]['distance'])
        print ("Average RSSI (" + str(anchor) + "): %.2f" % (float("{0:.2f}".format(meanRSSI))))
        # print ("Average RSSI: %.2f" % (float("{0:.2f}".format(meanRSSI_2))))
      # measuredPower = getMeasuredPower(meanRSSI, float(sys.argv[4]))##argument4: distance
      # avgRSSI = []
  except:
    raise
  return progress

###################### anchor calibration version ##############################################
def main(beacon, anchorData, beaconID):
  interval = 1
  progress = 0
  startTime = int(time.time()*1000)
  # print ("result_dict", result_dict)
  # avgRSSIFile.write(str(beacon) + ", ")
  # avgRSSIFile.write(str(devices[devIndex][0]) + ", ")
  # for curr_anchor, data in anchorData.items(): #beacon is the anchor set as beacon, curr_anchor is current anchor receiving from beacon
  while progress < 100:
    time.sleep(interval)
    try:
      progress = processEdges(interval*1000, startTime, beacon, anchorData, beaconID)
      print (progress)
    except:
      raise

###################### anchor calibration version ##############################################
def runMainAVers(sorted_devices, beaconID):
  global result_dict
  result_dict = copy.deepcopy(sorted_devices)
  for curr_dev, value in sorted_devices.items():
    print (curr_dev, value)
    main(curr_dev, value, beaconID)
    # else:
    #   if input("Enter the enter key to start the next device...") == '':
    #     main(index_currDev)
# runMainAVers()
temp = re.findall(r'\d+', sys.argv[2])
res = list(map(int, temp))
beaconID = 'b' + str(res[0])
distances = readFile("distances.json")
anchorList = storeAllDevices(mapname)
sorted_devices = findNearbyAnchors(sys.argv[2], mapname, distances)
runMainAVers(sorted_devices, beaconID)
# print (sorted_devices)
