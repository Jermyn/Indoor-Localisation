import zmq
import math
import time
import random
import json

gattCheck = zmq.Context().socket(zmq.PUSH)
gattCheck.connect("tcp://127.0.0.1:5566")


gatt = {
'pox0':	'c03845fd61f2',
'pox1':	'f32d732ef72c',
'pox2':	'e9d88a345bdf',
'pox3': 'faa54c2f56da',
'pox4': 'c8eef2af4d6b',
'pox5': 'ea2e9031910f',
'pox6': 'fe24d49a720f',
'pox7': 'e1817c079bee',
'pox8': 'eedba2717618',
'pox9': 'f13f78592431',
'pox10': 'f5be915ef451',
'pox11':	'd09c01a81f9f',
'pox12':	'ead70333a309',
'pox13':	'cd8797dce9c7',
'pox14':	'fc4007fa8b79',
'pox15':	'f044cab12ac3',
'pox16':	'e26140d67c5f',
'pox17':	'e25864f9de0d',
'pox18':	'd975b0c30e67',
'pox19':	'f646bdf64ab7',
'pox20':	'd31da0671289',
'pox21':	'fc6b721c7b56',
'pox22':	'ca564105d715',
'pox23':	'e689f853ef15',
'pox24':	'd55f1f3673f0',
'pox25':	'dbd6da6ef8b7',
'pox26':	'ca96a4a2d45d',
'pox27':	'ce0395cb7bc4'
}

def between (minValue, maxValue):
	return random.randint(minValue, maxValue)

def sendPoxid():
	number = between(0,27)
	topic = "GATTCHECK"
	data = json.dumps({
		# 'gattaddress': gatt["pox" + str(number)]
		'gattaddress': "pox" + str(number)
	})
	# print ("Sending data: pox" + str(number) + ", " + str(gatt["pox" + str(number)]))
	print ("Sending data: pox" + str(number))
	gattCheck.send_string(data)
	# gattCheck.send_multipart([topic.encode('utf-8'), data.encode('utf-8')])




def main():
  interval = 5
  while True:
    time.sleep(interval)
    try:
      sendPoxid()
    except:
      raise
main()