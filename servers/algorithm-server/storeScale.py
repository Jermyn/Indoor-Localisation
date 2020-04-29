import requests, json


def getScale(location):
	if location=="actlab":
		query_scale = 'query{map (id:"actlab") {scale}}'
	elif location=="actlab_test":
		query_scale = 'query{map (id:"actlab_test") {scale}}'
	elif location=="mini_actlab":
		query_scale = 'query{map (id:"mini_actlab") {scale}}'
	else:
		query_scale = 'query{map (id:"MD6") {scale}}'	
	r = requests.get("http://137.132.165.139:3000/graphql", {"query":query_scale})
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
	elif location=="mini_actlab":
		query_scale = 'query{map (id:"mini_actlab") {coordinates}}'
	else:
		query_scale = 'query{map (id:"MD6") {coordinates}}'	
	r = requests.get("http://137.132.165.139:3000/graphql", {"query":query_scale})
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
	r = requests.get("http://137.132.165.139:3000/graphql", {"query":query_image})
	img = r.text
	img_json = json.loads(img)
	img_link = img_json['data']['map']['imageURL']
	return img_link
# image = getImage("MD6")

def getMeasuredPower(anchorId):
	query_MP = 'query{anchors {id, measuredPower, device {id}}}'	
	r = requests.get("http://137.132.165.139:3000/graphql", {"query":query_MP})
	MP = r.text
	MP_json = json.loads(MP)
	i = 0
	while (i < len(MP_json['data']['anchors'])):
		if MP_json['data']['anchors'][i]['device']['id'] == anchorId:
			return MP_json['data']['anchors'][i]['measuredPower']
		i+=1
	return False

# MP = getMeasuredPower("11")
# print (MP)
