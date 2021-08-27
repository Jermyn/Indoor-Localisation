import requests, json, itertools
from collections import defaultdict


def getScale(location):
	if location=="actlab":
		query_scale = 'query{map (id:"actlab") {scale}}'
	elif location=="actlab_test":
		query_scale = 'query{map (id:"actlab_test") {scale}}'
	else:
		query_scale = 'query{map (id:"MD6") {scale}}'	
	r = requests.get("http://52.77.184.100:3000/graphql", {"query":query_scale})
	scale = r.text
	scale_json = json.loads(scale)
	return float(scale_json['data']['map']['scale'])
# numScale = getScale("actlab_test")
# print (numScale)

def getCoordinates(location):
	if location=="actlab":
		query_scale = 'query{map (id:"actlab") {coordinates}}'
	elif location=="actlab_test":
		query_scale = 'query{map (id:"actlab_test") {coordinates}}'
	else:
		query_scale = 'query{map (id:"MD6") {coordinates}}'	
	r = requests.get("http://52.77.184.100:3000/graphql", {"query":query_scale})
	scale = r.text
	scale_json = json.loads(scale)
	temp = scale_json['data']['map']['coordinates']
	return temp
# real = getCoordinates("MD6")

def getImage(location):
	if location=="actlab":
		query_image = 'query{map (id:"actlab") {imageURL}}'
	elif location=="actlab_test":
		query_image = 'query{map (id:"actlab_test") {imageURL}}'
	else:
		query_image = 'query{map (id:"MD6") {imageURL}}'	
	r = requests.get("http://52.77.184.100:3000/graphql", {"query":query_image})
	img = r.text
	img_json = json.loads(img)
	img_link = img_json['data']['map']['imageURL']
	return img_link
# image = getImage("MD6")

def getMeasuredPower():
	# print (anchorId)
	res = defaultdict(lambda:{})
	query_MP = 'query{anchors {id, measuredPower, device {id}}}'	
	r = requests.get("http://52.77.184.100:3000/graphql", {"query":query_MP})
	MP = r.text
	MP_json = json.loads(MP)
	for key, val in enumerate(MP_json['data']['anchors']):
		res[val['id']].update(val)
	return res
	# i = 0
	# while (i < len(MP_json['data']['anchors'])):
	# 	if MP_json['data']['anchors'][i]['device']['id'] == anchorId:
	# 		return MP_json['data']['anchors'][i]['measuredPower']
	# 	i+=1
	# return MP_json['data']['anchors'][0]

# MP = getMeasuredPower()
# print (MP)

def getLocation():
	res = defaultdict(lambda:{})
	query = 'query{devices {id, type, location}}'
	r = requests.get("http://52.77.184.100:3000/graphql", {"query":query})
	loc = r.text
	loc_json = json.loads(loc)
	for key, val in enumerate(loc_json['data']['devices']):
		res[val['id']].update(val)
	return res
# loc = getLocation()
# print (loc)

def getAnchors():
	res = defaultdict(lambda:{})
	query = 'query{anchors {id sensitivity measuredPower offset device { id type location }}}'
	r = requests.get("http://52.77.184.100:3000/graphql", {"query":query})
	anchors = r.text
	anchors_json = json.loads(anchors)
	for key, val in enumerate(anchors_json['data']['anchors']):
		res[val['id']].update(val)
	return res
# print (getAnchors())