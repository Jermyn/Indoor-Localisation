import json, requests
from collections import defaultdict


str_deviceID = []

def getNavMesh(location):
	res = defaultdict(lambda:{})
	query_mesh = ''
	if location == 'Clinic A_Level 1':
		query_mesh = 'query{ map (id: "Clinic A_Level 1") {navMesh}}'
	elif location == 'AH main lobby':
		query_mesh = 'query{ map (id: "AH main lobby") {navMesh}}'
	elif location == 'Walkway_to_B':
		query_mesh = 'query{ map (id: "Walkway_to_B") {navMesh}}'
	elif location == 'Walkway_to_B_test':
		query_mesh = 'query{ map (id: "Walkway_to_B_test") {navMesh}}'
	elif location == 'Clinic B_Level 2':
		query_mesh = 'query{ map (id: "Clinic B_Level 2") {navMesh}}'
	elif location == 'Endoscopy':
		query_mesh = 'query{ map (id: "Endoscopy") {navMesh}}'
	elif location == 'actlab':
		query_mesh = 'query{ map (id: "actlab") {navMesh}}'
	r = requests.get("http://52.77.184.100:3000/graphql", {"query":query_mesh})
	mesh = r.text
	mesh_json = json.loads(mesh)
	print (mesh_json)
	return mesh_json['data']
	# for key, val in enumerate(mesh_json['data']):
		# res[mesh_json['data']val['id']].update(val)
	# return res
# print(getNavMesh('E4-08 Floorplan'))

def getPOI(location):
	poi_list = defaultdict(lambda: {})
	query_poi = ''
	if location == 'AH main lobby':
		query_poi = 'query{map (id:"AH main lobby") {pois}}'
	elif location == 'Walkway_to_B_test':
		query_poi = 'query{map (id:"Walkway_to_B_test") {pois}}'
	r = requests.get("http://52.77.184.100:3000/graphql", {"query":query_poi})
	str_poi = r.text
	poi = json.loads(str_poi)
	test = poi['data']['map']
	for poi in test['pois']['features']:
		str_id = poi['properties']['id']
		poi_list[str_id]: {'lng': 0, 'lat': 0 }
		str_coordinates = { 'lng': poi['geometry']['coordinates'][0], 'lat': poi['geometry']['coordinates'][1] }
		poi_list[str_id].update(str_coordinates)
	return poi_list
# print(len(getPOI("AH main lobby")))

def actlab_POI():
	poi_list = defaultdict(lambda: {})
	query_poi = 'query{map (id:"actlab") {pois}}'

	r = requests.get("http://52.77.184.100:3000/graphql", {"query":query_poi})
	str_poi = r.text
	poi = json.loads(str_poi)
	test = poi['data']['map']
	for poi in test['pois']['features']:
		str_id = poi['properties']['id']
		# print (str_id)
		poi_list[str_id]: {'lng': 0, 'lat': 0 }
		# print (poi_list)
		str_coordinates = { 'lng': poi['geometry']['coordinates'][0], 'lat': poi['geometry']['coordinates'][1] }
		# str_coordinates = str(str_coordinates[0]).strip('"\'"') + ", " + str(str_coordinates[1]).strip('"\'"')
		# print (str_coordinates[0])
		poi_list[str_id].update(str_coordinates)
		# str_points = str_id + ", " + str_coordinates
		# poi_list.append(str_points.split(", "))
	# poi_list = sorted(poi_list)
	return poi_list
# print(actlab_POI())

def office_POI():
	poi_list = []
	query_poi = 'query{map (id:"office") {graph}}'

	r = requests.get("http://137.132.165.139/graphql", {"query":query_poi})
	str_poi = r.text
	poi = json.loads(str_poi)
	test = json.loads(poi['data']['map']['graph'])
	for i in range(0, len(test['nodes'])):
		# print (test['nodes'][i][1])
		if "poi" in test['nodes'][i][0]:
			# print (test['nodes'][i][1])
			str_deviceID = (test['nodes'][i][0].split(":"))
			
			str_coordinates = str(test['nodes'][i][1]['coordinates'][1]).strip('"\'"') + ", " + str(test['nodes'][i][1]['coordinates'][0]).strip('"\'"')
			str_points = str_deviceID[1] + ", " + str_coordinates
			poi_list.append(str_points.split(", "))
	poi_list = sorted(poi_list)
	# print (poi_list)
	return poi_list		
# office_POI()

def ward5_POI():
	poi_list = []
	query_poi = 'query{map (id:"ward5678") {graph}}'

	r = requests.get("http://137.132.165.139/graphql", {"query":query_poi})
	str_poi = r.text
	poi = json.loads(str_poi)
	test = json.loads(poi['data']['map']['graph'])
	for i in range(0, len(test['nodes'])):
		# print (test['nodes'][i][1])
		if "poi" in test['nodes'][i][0]:
			# print (test['nodes'][i][1])
			str_deviceID = (test['nodes'][i][0].split(":"))
			
			str_coordinates = str(test['nodes'][i][1]['coordinates'][0]).strip('"\'"') + ", " + str(test['nodes'][i][1]['coordinates'][1]).strip('"\'"')
			str_points = str_deviceID[1] + ", " + str_coordinates
			poi_list.append(str_points.split(", "))
	poi_list = sorted(poi_list)
	# print (poi_list)
	return poi_list