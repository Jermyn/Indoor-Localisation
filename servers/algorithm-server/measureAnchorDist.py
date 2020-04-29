from cache import getCache
from storePOI import getPOI
import sys
import math
from storeScale import getScale
import pdb

def calculateDistance(pos1, pos2):
	map_scale = getScale('actlab_test')
	# print (pos1, pos2)
	return map_scale * math.sqrt(((float(pos1['lat']) - float(pos2['lat']))**2 + ((float(pos1['lng']) - float(pos2['lng']))**2)))

def calculateDistance_BVers(pos1, pos2):
	map_scale = getScale('actlab_test')
	# print (pos1, pos2)
	return map_scale * math.sqrt(((float(pos1['lat']) - float(pos2[2]))**2 + ((float(pos1['lng']) - float(pos2[1]))**2)))

cache = getCache()
POI = getPOI("actlab_test")
# print (cache['anchors'])
# print (POI)

def anchorsComparison():
	global cache
	position1 = {}
	position2 = {}

	i = 0
	try:
		while i < len(cache['anchors']):
			if cache['anchors'][i]['device']['location']['map']['id'] == 'actlab_test':
				if cache['anchors'][i]['id'] == sys.argv[1]:
					position1 = cache['anchors'][i]['device']['location']
				if cache['anchors'][i]['id'] == sys.argv[2]:
					position2 = cache['anchors'][i]['device']['location']
				# break
			i += 1
		print(calculateDistance(position1, position2))
	except:
		pass

def anchorBeaconComparison(receiverId, calibrationPt):
	global cache, POI
	position1 = {}
	distances = []
	poi = POI[int(calibrationPt)-1]

	position1 = cache['anchors'][receiverId]['device']['location']
	dist = calculateDistance_BVers(position1, poi)
	receiverId = cache['anchors'][receiverId]['device']['id']
	return receiverId, dist
# anchorBeaconComparison(sys.argv[1])