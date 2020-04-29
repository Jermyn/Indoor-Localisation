import time
import urllib.request, json 
import numpy as np
import json
import zmq

requests = zmq.Context().socket(zmq.PULL)
requests.bind('tcp://137.132.165.139:5556')

while True:
    x = requests.recv_json()
    print(x)
