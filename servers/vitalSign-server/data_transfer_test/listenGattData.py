import urllib.request, json 
import zmq

# requests = zmq.Context().socket(zmq.PULL)
# requests.bind('tcp://137.132.165.139:')
hr0 = zmq.Context().socket(zmq.PULL)
hr0.bind('tcp://137.132.165.139:8000')
hr0.setsockopt(zmq.LINGER, -1)
hr1 = zmq.Context().socket(zmq.PULL)
hr1.bind('tcp://137.132.165.139:8001')
hr1.setsockopt(zmq.LINGER, -1)
hr2 = zmq.Context().socket(zmq.PULL)
hr2.bind('tcp://137.132.165.139:8002')
hr2.setsockopt(zmq.LINGER, -1)
imu0 = zmq.Context().socket(zmq.PULL)
imu0.bind('tcp://137.132.165.139:6000')
imu0.setsockopt(zmq.LINGER, -1)
imu1 = zmq.Context().socket(zmq.PULL)
imu1.bind('tcp://137.132.165.139:6001')
imu1.setsockopt(zmq.LINGER, -1)


a = {}
x = {}
y = {}
z = {}
while True:
	try:
		try:
			x = hr0.recv(flags=zmq.NOBLOCK)
		except zmq.Again as e:
			pass
		try:
			y = hr1.recv(flags=zmq.NOBLOCK)
		except zmq.Again as e:
			pass
		try:
			z = hr2.recv(flags=zmq.NOBLOCK)
		except zmq.Again as e:
			pass
		try:
			a = imu0.recv(flags=zmq.NOBLOCK)
		except zmq.Again as e:
			pass
		try:
			b = imu1.recv(flags=zmq.NOBLOCK)
		except zmq.Again as e:
			pass
		print (x, y, z,a)
		if x != {}:
			my_json = x.decode('utf8').replace("'", '"')
			# print(my_json)
			# print('- ' * 20)

			# Load the JSON to a Python list & dump it back out as formatted JSON
			data = json.loads(my_json)
			s = json.dumps(data, indent=4, sort_keys=True)
			print ("hr0")
		if y != {}:
			my_json = y.decode('utf8').replace("'", '"')
			# print(my_json)
			# print('- ' * 20)

			# Load the JSON to a Python list & dump it back out as formatted JSON
			data = json.loads(my_json)
			s = json.dumps(data, indent=4, sort_keys=True)
			print ("hr1")
		if z != {}:
			my_json = z.decode('utf8').replace("'", '"')
			# print(my_json)
			# print('- ' * 20)

			# Load the JSON to a Python list & dump it back out as formatted JSON
			data = json.loads(my_json)
			s = json.dumps(data, indent=4, sort_keys=True)
			print ("hr2")
		if a != {}:
			my_json = a.decode('utf8').replace("'", '"')
			# print(my_json)
			# print('- ' * 20)

			# Load the JSON to a Python list & dump it back out as formatted JSON
			data = json.loads(my_json)
			s = json.dumps(data, indent=4, sort_keys=True)
			print ("imu0")
	except (KeyboardInterrupt):
		hr0.close()
		hr1.close()
		hr2.close()
		imu0.close()
		imu1.close()

	