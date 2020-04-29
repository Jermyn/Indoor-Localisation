import time
import urllib.request, json 
import numpy as np
import json
import zmq
import binascii
import struct
import math
import base64
import threading
import bokeh
import csv
import pyrebase
from elasticsearch import Elasticsearch
from datetime import datetime

from bokeh.io import curdoc
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show, output_file
from bokeh.layouts import row, column, gridplot
from bokeh.models.widgets import PreText,Select, Button
from bokeh.resources import INLINE
from ipywidgets import interact
from collections import deque

# Firebase Config

config = {
    "apiKey": "AIzaSyC0TRzBu4_nZx7aHsXysIE9fxD-9Dh-JQo",
    "authDomain": "vital-simulator.firebaseapp.com",
    "databaseURL": "https://vital-simulator.firebaseio.com",
    "storageBucket": "vital-simulator.appspot.com",
    "serviceAccount": "./vital-simulator-firebase-adminsdk-mjleq-0bfdb59e4e.json"
}

firebase = pyrebase.initialize_app(config)

auth = firebase.auth()
#authenticate a user
user = auth.sign_in_with_email_and_password("admin@admin.com", "password")
db = firebase.database()

# Elasticsearch Config

es = Elasticsearch([{'host': 'localhost', 'port':9200}])

dataQueue = deque()
timeQueue = deque()
dataHomeList = []
dataEcgList = []
dataHrList = []
tempECGList = []
dataEcgList.append("ecg1Sample1,ecg1Sample2,ecg2Sample1,ecg2Sample2,ResRate1Sample1,ResRate1Sample2,ResRate2Sample1,ResRate2Sample2,timeStamp,sysTime")
dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp,sysTime")
dataHrList.append("hr,timeStamp,sysTime")

uuid=[]
charac=[]
cache={}
ct=0
ctHR=0
dataCt = 0
previousSequenceNumber = None
previousTimeStamp = None
initialTime =0
endTime =0
timeDuration=0
flag=1
currentUUID=""
currentCharac=""
currentMode=0
sensor=0

# ecgFile = open("01_ECG.csv", "a") 
# homeFile = open("01_Home.csv", "a") 
# hrFile = open("01_HR.csv", "a") 

uuid.append('-')
charac.append('-')

sourceAx = ColumnDataSource(dict(x=[],y=[]))
sourceAy = ColumnDataSource(dict(x=[],y=[]))
sourceAz = ColumnDataSource(dict(x=[],y=[]))
sourceAx2 = ColumnDataSource(dict(x=[],y=[]))
sourceAy2 = ColumnDataSource(dict(x=[],y=[]))
sourceAz2 = ColumnDataSource(dict(x=[],y=[]))

sourceMx = ColumnDataSource(dict(x=[],y=[]))
sourceMy = ColumnDataSource(dict(x=[],y=[]))
sourceMz = ColumnDataSource(dict(x=[],y=[]))

sourceGx = ColumnDataSource(dict(x=[],y=[]))
sourceGy = ColumnDataSource(dict(x=[],y=[]))
sourceGz = ColumnDataSource(dict(x=[],y=[]))

sourceHR = ColumnDataSource(dict(x=[],y=[]))

source0 = ColumnDataSource(dict(x=[],y=[]))
source1 = ColumnDataSource(dict(x=[],y=[]))
source2 = ColumnDataSource(dict(x=[],y=[]))
source3 = ColumnDataSource(dict(x=[],y=[]))

source4 = ColumnDataSource(dict(x=[],y=[]))

fig=figure(plot_width=1800, plot_height=800, title="Acceleration")
fig.line(source=sourceAx, x='x', y='y', line_width=2, alpha=.85, color='red')
fig.line(source=sourceAy, x='x', y='y', line_width=2, alpha=.65, color='blue')
fig.line(source=sourceAz, x='x', y='y', line_width=2, alpha=.45, color="green")
fig.line(source=sourceMx, x='x', y='y', line_width=2, alpha=.85, color='blue')
fig.line(source=sourceMy, x='x', y='y', line_width=2, alpha=.65, color='blue')
fig.line(source=sourceMz, x='x', y='y', line_width=2, alpha=.45, color='blue')
fig.line(source=sourceGx, x='x', y='y', line_width=2, alpha=.85, color='green')
fig.line(source=sourceGy, x='x', y='y', line_width=2, alpha=.65, color='green')
fig.line(source=sourceGz, x='x', y='y', line_width=2, alpha=.45, color='green')
figAcc=figure(plot_width=700, plot_height=400, title="Acceleration")
figAcc.line(source=sourceAx2, x='x', y='y', line_width=2, alpha=.85, color='red')
figAcc.line(source=sourceAy2, x='x', y='y', line_width=2, alpha=.65, color='blue')
figAcc.line(source=sourceAz2, x='x', y='y', line_width=2, alpha=.45, color="green")
# figAcc.line(source=sourceMx2, x='x', y='y', line_width=2, alpha=.85, color='blue')
# figAcc.line(source=sourceMy2, x='x', y='y', line_width=2, alpha=.65, color='blue')
# figAcc.line(source=sourceMz2, x='x', y='y', line_width=2, alpha=.45, color='blue')
# figAcc.line(source=sourceGx2, x='x', y='y', line_width=2, alpha=.85, color='green')
# figAcc.line(source=sourceGy2, x='x', y='y', line_width=2, alpha=.65, color='green')
# figAcc.line(source=sourceGz2, x='x', y='y', line_width=2, alpha=.45, color='green')

figH=figure(plot_width=1400, plot_height=400, title="Heart Rate")
figH.line(source=sourceHR, x='x', y='y', line_width=2, alpha=.85, color='red')

fig0=figure(plot_width=700, plot_height=400, title="ECG 1")
fig0.line(source=source0, x='x', y='y', line_width=2, alpha=.85, color='red')

fig1=figure(plot_width=700, plot_height=400, title="ECG 2")
fig1.line(source=source1, x='x', y='y', line_width=2, alpha=.85, color='red')
fig1.xaxis.visible = True
fig1.yaxis.visible = True

fig2=figure(plot_width=700, plot_height=400, title="Respiration 1")
fig2.line(source=source2, x='x', y='y', line_width=2, alpha=.85, color='blue')

fig3=figure(plot_width=700, plot_height=400, title="Respiration 2")
fig3.line(source=source3, x='x', y='y', line_width=2, alpha=.85, color='blue')

fig4=figure(plot_width=700, plot_height=400, title="heart beat")
fig4.line(source=source4, x='x', y='y', line_width=2, alpha=.85, color='blue')



def updateCache():
    requests = zmq.Context().socket(zmq.REQ)
    requests.connect('tcp://137.132.165.139:5570')
    global cache
    requests.send_string("CACHE_REQUEST")
    cache = requests.recv_json()
    if cache and 'version' in cache:
        print('loaded cache version', cache['version'])
updateCache()

for gatt in cache['gatts']:
    uuid.append(gatt)
    for key in cache['gatts'][gatt]['profile'].keys():
        for characther in cache['gatts'][gatt]['profile'][key].keys():
            if characther not in charac:
                charac.append(characther)
# print(chrac)
def uuidChanged(attr,old,new):
    global currentUUID, currentCharac
    # if new != currentUUID:
        # sensor+=1
    currentUUID=new
        # print ("Initial_sensor:" + str(sensor))
    print(new)

def characChanged(attr,old,new):
    global currentUUID, currentCharac
    currentCharac=new
    print(new)

def durationChanged(attr,old,new):
    global timeDuration
    timeDuration=new
    print("Time: " + new)

def buttonClicked():
    global flag, initialTime, endTime, currentMode, button, dataHomeList, dataEcgList, dataHrList
    if flag==1:
        button.button_type="warning"
        button.label="Collecting..."
        flag=0
        initialTime=0
        endTime=0
        print("Start Collecting Data") 
    else:
        button.button_type="success"
        button.label="Collect Data"
        # flag=1
        initialTime=0
        endTime=0
        currentMode=0
        print("Stop Collecting Data")


ticker1 = Select(value='-', options=uuid, title="UUID")
ticker2 = Select(value='-', options=charac, title="Characteristic")
ticker1.on_change("value", uuidChanged)
ticker2.on_change("value", characChanged)

button = Button(label="Collect Data", button_type="success")
button.on_click(buttonClicked)

duration = Select(value='-', options=['-','1','2','3','4','5','6','7','8','9','10','20','30','120'], title="Collection time")
duration.on_change("value", durationChanged)

def endProcess():
    global initialTime, endTime, flag, currentMode, button, ecgFile, homeFile, hrFile, dataHomeList, dataEcgList, dataHrList
    global done

    print("Process Ended")

    # totalPack=(endTime-initialTime)*1000/time
    # receivePack = len(dataList)
    # efficiency = receivePack / totalPack * 100
    # print("Efficiency: " + str(efficiency))

    # initialTime=0
    

    # write_file =str("01_ECG" + str(int(time.time())) + ".csv")
    # with open(write_file, "w") as output:
    #     for line in dataEcgList:
    #         output.write(line + '\n')
    # dataEcgList=[]
    # print("Saved to ECG file")

    # write_file =str("01_Home" + str(int(time.time())) + ".csv")
    # with open(write_file, "w") as output:
    #     for line in dataHomeList:
    #         output.write(line + '\n')
    # dataHomeList=[]
    # print("Saved to Home file")

    write_file =str("01_HR" + str(int(time.time())) + ".csv")
    with open(write_file, "w") as output:
        for line in dataHrList:
            output.write(line + '\n')
    dataHrList=[]
    print("Saved to Hr file")

    dataEcgList.append("ecg1Sample1,ecg1Sample2,ecg2Sample1,ecg2Sample2,ResRate1Sample1,ResRate1Sample2,ResRate2Sample1,ResRate2Sample2,timeStamp,sysTime, timeQueue")
    dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp,sysTime")
    dataHrList.append("hr,timeStamp,sysTime")

    initialTime=0
    currentMode=0
    

filter_taps= ([
    0.000000,-0.000001,-0.000002,-0.000005,-0.000009,-0.000015,-0.000022,-0.000032,-0.000044,-0.000058,-0.000075,-0.000094,-0.000115,
    -0.000138,-0.000160,-0.000183,-0.000204,-0.000221,-0.000234,-0.000240,-0.000236,-0.000221,-0.000193,-0.000148,-0.000084,0.000000,
    0.000107,0.000237,0.000393,0.000573,0.000778,0.001005,0.001253,0.001517,0.001793,0.002075,0.002355,0.002625,0.002875,0.003095,
    0.003273,0.003396,0.003452,0.003428,0.003311,0.003088,0.002747,0.002276,0.001667,0.000910,-0.000000,-0.001067,-0.002293,-0.003676,
    -0.005212,-0.006893,-0.008710,-0.010648,-0.012693,-0.014823,-0.017019,-0.019255,-0.021507,-0.023746,-0.025945,-0.028075,-0.030108,
    -0.032015,-0.033770,-0.035347,-0.036723,-0.037879,-0.038796,-0.039462,-0.039865,0.960000,-0.039865,-0.039462,-0.038796,-0.037879,
    -0.036723,-0.035347,-0.033770,-0.032015,-0.030108,-0.028075,-0.025945,-0.023746,-0.021507,-0.019255,-0.017019,-0.014823,-0.012693,
    -0.010648,-0.008710,-0.006893,-0.005212,-0.003676,-0.002293,-0.001067,-0.000000,0.000910,0.001667,0.002276,0.002747,0.003088,
    0.003311,0.003428,0.003452,0.003396,0.003273,0.003095,0.002875,0.002625, 0.002355, 0.002075, 0.001793, 0.001517, 0.001253, 
    0.001005,0.000778,0.000573,0.000393,0.000237,0.000107,0.000000,-0.000084,-0.000148,-0.000193,-0.000221,-0.000236,-0.000240, 
    -0.000234,-0.000221,-0.000204,-0.000183,-0.000160,-0.000138,-0.000115,-0.000094,-0.000075,-0.000058,-0.000044,-0.000032,-0.000022, 
    -0.000015,-0.000009,-0.000005,-0.000002,-0.000001,0.000000
])


heartRate=[]
time10s=(int(time.time())*1000)+10000
beat=0
timer = 0
count = 0
hpf = []
hpfr = []

def ecgSensor(x):
    global ct, initialTime, endTime, dataEcgList, timeDuration, currentMode, previousSequenceNumber, timeQueue, previousTimeStamp, dataHrList, dataHomeList
    global timer,beat,count,hpf,time10s, hpfr, dataCt, tempECGList


    d = base64.b64decode(x['data']) #x['data'].decode('base64')
    data=bytearray(d)


    currentTimeStamp = timeQueue.popleft()

    if previousTimeStamp != None: 
        if (previousTimeStamp - currentTimeStamp) >= 1000:
            ct+=(previousTimeStamp - currentTimeStamp)

    previousTimeStamp = currentTimeStamp

    sequenceNumber = data[0]

    if previousSequenceNumber is None:
        ct = 0
    else:
        if previousSequenceNumber> sequenceNumber:
            ct += (256-previousSequenceNumber + sequenceNumber)*4
        else:
            ct += (sequenceNumber-previousSequenceNumber)*4

    previousSequenceNumber = sequenceNumber

    ecg1Sample1 = (data[1] & 0xff)<<8 | (data[2] & 0xff)
    ecg1Sample2 = (data[3] & 0xff)<<8 | (data[4] & 0xff)
    ecg2Sample1 = (data[5] & 0xff)<<8 | (data[6] & 0xff)
    ecg2Sample2 = (data[7] & 0xff)<<8 | (data[8] & 0xff)

    ResRate1Sample1 = (data[9] & 0xff)<<8 | (data[10] & 0xff)
    ResRate1Sample2 = (data[11] & 0xff)<<8 | (data[12] & 0xff)
    ResRate2Sample1 = (data[13] & 0xff)<<8 | (data[14] & 0xff)
    ResRate2Sample2 = (data[15] & 0xff)<<8 | (data[16] & 0xff)

    ecg1Sample = ecg1Sample1<<16 | ecg1Sample2
    ecg2Sample = ecg2Sample1<<16 | ecg2Sample2

    res1Sample = ResRate1Sample1<<16 | ResRate1Sample2
    res2Sample = ResRate2Sample1<<16 | ResRate2Sample2

    # new_data0 = dict(x=[ct],y=[ecg1Sample])
    # source0.stream(new_data0,1000)
    ecg2Sample = ecg2Sample/10000000

    

    if len(hpf)<151:
        hpf.append(float(ecg2Sample))
        hpfr.append(res2Sample)
    else:
        if(int(time.time())*1000)>=time10s:
            time10s+=5000
            new_data4 = dict(x=[ct],y=[beat*6])
            source4.stream(new_data4,1000)
            beat=0
        hpf[150]=ecg2Sample
        hpfr[150] = res2Sample
        hrPoint=0
        resPoint = 0
        j=0
        while j<len(hpf):
            hrPoint+=hpf[j]*float(filter_taps[j])
            resPoint += hpfr[j]*float(filter_taps[j])
            j+=1
        newHrPoint = math.pow(hrPoint,2)
        if newHrPoint>1:
            beat+=1
        new_data1 = dict(x=[ct],y=[newHrPoint])
        source1.stream(new_data1,1000)
        new_data3 = dict(x=[ct],y=[resPoint])
        source3.stream(new_data3,1000)
        hpf.pop(0)
        hpf.append(0)
        hpfr.pop(0)
        hpfr.append(0)

    # new_data2 = dict(x=[ct],y=[res1Sample])
    # source2.stream(new_data2,1000)

    # new_data3 = dict(x=[ct],y=[res2Sample])
    # source3.stream(new_data3,1000)
    uuid = x['uuid']
    #Firebase
    # vital = {"ecgHrPoint": newHrPoint, "resPoint": resPoint, "ct": ct, "timestamp": currentTimeStamp }
    # tempECGList.append(vital)
    # dataCt += 1
    # if dataCt == 500:
    #     db.child("ecg").child(uuid).set(tempECGList, token=user['idToken'])
    #     dataCt = 0
    #     tempECGList = []
    #ElasticSearch
    doc = {
        "ecgHrPoint": newHrPoint,
        "resPoint": resPoint,
        "ct": ct,
        "uuid": uuid,
        'timestamp': datetime.fromtimestamp((float(currentTimeStamp)/1000)).strftime("%Y-%m-%dT%H:%M:%S")
    }
    res = es.index(index="ecg", doc_type='vital', body=doc)

    if flag==0:
        if initialTime ==0:
            currentMode=1
            initialTime=int(time.time())
            endTime = initialTime + (5*60) 
        else:
            dataEcgList.append(str(ecg1Sample1) + "," + str(ecg1Sample2) + "," + str(ecg2Sample1) + "," + str(ecg2Sample2) + "," + str(ResRate1Sample1) + "," + str(ResRate1Sample2) + "," + str(ResRate2Sample1) + "," + str(ResRate2Sample2) + "," + str(ct) + "," + str(int(time.time()*1000)) + "," + str(currentTimeStamp))
            # if int(time.time())>endTime:
            #     print ("Writing to file")
                # endProcess("ecg1Output_" + str(time.time()) + ".csv", dataEcgList,4)
                # endProcess()
        
def homeRehab(x):
    global initialTime, endTime, dataHomeList, timeDuration, currentMode
#     x = requests.recv_json()
    d = base64.b64decode(x['data']) #x['data'].decode('base64')
    data=bytearray(d)
    ts0 = data[2] & 0x0f;
    ts1 = data[4] & 0x0f;
    ts2 = data[6] & 0x0f;
    ts3 = (data[8] & 0xf0) >> 4;
    ts4 = (data[10] & 0xf0) >> 4;
    ts5 = (data[12] & 0xf0) >> 4;
    timestamp = ts0 | (ts1<<4) | (ts2 <<8) | (ts3 << 12) | (ts4 << 16) | (ts5 << 20);
    
    ax = (data[2] & 0xf0) | (data[3] << 8);
    ay = (data[4] & 0xf0) | (data[5] << 8);
    az = (data[6] & 0xf0) | (data[7] << 8);
    accX =(ax + 2**15) % 2**16 - 2**15
    accY =(ay + 2**15) % 2**16 - 2**15
    accZ =(az + 2**15) % 2**16 - 2**15
    
    mx = ((data[8] & 0x0f)<<8 | data[9])<<4
    my = ((data[10] & 0x0f)<<8 | data[11])<<4
    mz = ((data[12] & 0x0f)<<8 | data[13])<<4
    magX =(mx + 2**15) % 2**16 - 2**15
    magY =(my + 2**15) % 2**16 - 2**15
    magZ =(mz + 2**15) % 2**16 - 2**15
    
    gx = data[14]<<8 | data[15]
    gy = data[16]<<8 | data[17]
    gz = data[18]<<8 | data[19]
    gyroX =(gx + 2**15) % 2**16 - 2**15
    gyroY =(gy + 2**15) % 2**16 - 2**15
    gyroZ =(gz + 2**15) % 2**16 - 2**15
    
    new_dataAx = dict(x=[timestamp],y=[accX])
    sourceAx.stream(new_dataAx,100)
    new_dataAy = dict(x=[timestamp],y=[accY])
    sourceAy.stream(new_dataAy,100)
    new_dataAz = dict(x=[timestamp],y=[accZ])
    sourceAz.stream(new_dataAz,100)

    print("HOME REHAB")

    # new_dataMx = dict(x=[timestamp],y=[magX])
    # sourceMx.stream(new_dataMx,100)
    # new_dataMy = dict(x=[timestamp],y=[magY])
    # sourceMy.stream(new_dataMy,100)
    # new_dataMz = dict(x=[timestamp],y=[magZ])
    # sourceMz.stream(new_dataMz,100)
    
    # new_dataGx = dict(x=[timestamp],y=[gyroX])
    # sourceGx.stream(new_dataGx,100)
    # new_dataGy = dict(x=[timestamp],y=[gyroY])
    # sourceGy.stream(new_dataGy,100)
    # new_dataGz = dict(x=[timestamp],y=[gyroZ])
    # sourceGz.stream(new_dataGz,100)
    uuid = x['uuid']
    #Firebase
    vital = {"accX": accX, "accY": accY, "accZ": accZ, "magX": magX, "magY": magY, "magZ": magZ, "gyroX": gyroX, "gyroY": gyroY, "gyroZ": gyroZ, "timestamp": int(time.time()*1000) }
    db.child("homerehab").child(uuid).set(vital, token=user['idToken'])

    #ElasticSearch
    doc = {
        "accX": accX,
        "accY": accY,
        "accZ": accZ,
        "magX": magX,
        "magY": magY,
        "magZ": magZ,
        "gyroX": gyroX,
        "gyroY": gyroY,
        "gyroZ": gyroZ,
        'timestamp': datetime.now(),
        'uuid':uuid
    }
    res = es.index(index="homerehab", doc_type='vital', body=doc)

    if flag==0:
        if initialTime ==0:
            initialTime=int(time.time())
            endTime = initialTime + (int(timeDuration)*60) 
            # dataHomeList=[]
            currentMode=1
            # initialTime=int(time.time())
            # endTime = initialTime + (int(5)*60)*1000
            # dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp")
            # print("start")
        else:
            dataHomeList.append(str(accX) + "," + str(accY) + "," + str(accZ) + "," + str(magX) + "," + str(magY) + "," + str(magZ) + "," + str(gyroX) + "," + str(gyroY) + "," + str(gyroZ) + "," + str(timestamp) + "," + str(int(time.time()*1000)))
            # if timestamp>endTime:
            #     endProcess()
            #     print("Writing to file")
            #     endProcess("homeOutput_" + str(time.time()) + ".csv", dataHomeList,20)
    
def homeRehab2(x):
    global initialTime, endTime, dataHomeList, timeDuration, currentMode
#     x = requests.recv_json()
    d = base64.b64decode(x['data']) #x['data'].decode('base64')
    data=bytearray(d)
    ts0 = data[2] & 0x0f;
    ts1 = data[4] & 0x0f;
    ts2 = data[6] & 0x0f;
    ts3 = (data[8] & 0xf0) >> 4;
    ts4 = (data[10] & 0xf0) >> 4;
    ts5 = (data[12] & 0xf0) >> 4;
    timestamp = ts0 | (ts1<<4) | (ts2 <<8) | (ts3 << 12) | (ts4 << 16) | (ts5 << 20);
    
    ax = (data[2] & 0xf0) | (data[3] << 8);
    ay = (data[4] & 0xf0) | (data[5] << 8);
    az = (data[6] & 0xf0) | (data[7] << 8);
    accX =(ax + 2**15) % 2**16 - 2**15
    accY =(ay + 2**15) % 2**16 - 2**15
    accZ =(az + 2**15) % 2**16 - 2**15
    
    mx = ((data[8] & 0x0f)<<8 | data[9])<<4
    my = ((data[10] & 0x0f)<<8 | data[11])<<4
    mz = ((data[12] & 0x0f)<<8 | data[13])<<4
    magX =(mx + 2**15) % 2**16 - 2**15
    magY =(my + 2**15) % 2**16 - 2**15
    magZ =(mz + 2**15) % 2**16 - 2**15
    
    gx = data[14]<<8 | data[15]
    gy = data[16]<<8 | data[17]
    gz = data[18]<<8 | data[19]
    gyroX =(gx + 2**15) % 2**16 - 2**15
    gyroY =(gy + 2**15) % 2**16 - 2**15
    gyroZ =(gz + 2**15) % 2**16 - 2**15
    
    new_dataAx = dict(x=[timestamp],y=[accX])
    sourceAx2.stream(new_dataAx,100)
    new_dataAy = dict(x=[timestamp],y=[accY])
    sourceAy2.stream(new_dataAy,100)
    new_dataAz = dict(x=[timestamp],y=[accZ])
    sourceAz2.stream(new_dataAz,100)

    print("HOME REHAB")

    # new_dataMx = dict(x=[timestamp],y=[magX])
    # sourceMx.stream(new_dataMx,100)
    # new_dataMy = dict(x=[timestamp],y=[magY])
    # sourceMy.stream(new_dataMy,100)
    # new_dataMz = dict(x=[timestamp],y=[magZ])
    # sourceMz.stream(new_dataMz,100)
    
    # new_dataGx = dict(x=[timestamp],y=[gyroX])
    # sourceGx.stream(new_dataGx,100)
    # new_dataGy = dict(x=[timestamp],y=[gyroY])
    # sourceGy.stream(new_dataGy,100)
    # new_dataGz = dict(x=[timestamp],y=[gyroZ])
    # sourceGz.stream(new_dataGz,100)

    uuid = x['uuid']
    #Firebase
    vital = {"accX": accX, "accY": accY, "accZ": accZ, "magX": magX, "magY": magY, "magZ": magZ, "gyroX": gyroX, "gyroY": gyroY, "gyroZ": gyroZ, "timestamp": int(time.time()*1000) }
    db.child("homerehab2").child(uuid).set(vital, token=user['idToken'])

    #ElasticSearch
    doc = {
        "accX": accX,
        "accY": accY,
        "accZ": accZ,
        "magX": magX,
        "magY": magY,
        "magZ": magZ,
        "gyroX": gyroX,
        "gyroY": gyroY,
        "gyroZ": gyroZ,
        'timestamp': datetime.now(),
        "uuid": uuid
    }
    res = es.index(index="homerehab2", doc_type='vital', body=doc)

    if flag==0:
        if initialTime ==0:
            initialTime=int(time.time())
            endTime = initialTime + (int(timeDuration)*60) 
            # dataHomeList=[]
            currentMode=1
            # initialTime=int(time.time())
            # endTime = initialTime + (int(5)*60)*1000
            # dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp")
            # print("start")
        else:
            dataHomeList.append(str(accX) + "," + str(accY) + "," + str(accZ) + "," + str(magX) + "," + str(magY) + "," + str(magZ) + "," + str(gyroX) + "," + str(gyroY) + "," + str(gyroZ) + "," + str(timestamp) + "," + str(int(time.time()*1000)))
            # if timestamp>endTime:
            #     endProcess()
            #     print("Writing to file")
            #     endProcess("homeOutput_" + str(time.time()) + ".csv", dataHomeList,20)
    

def heartRate(x):
    global ctHR, flag, dataHrList, initialTime, endTime, timeDuration, currentMode

    d = base64.b64decode(x['data'])
    data=bytearray(d)
    HRMEasurement = (data[1] + 2**15) % 2**16 - 2**15

    new_dataHR = dict(x=[ctHR],y=[HRMEasurement])
    sourceHR.stream(new_dataHR,100)

    uuid = x['uuid']
    #Firebase
    vital = {"value": HRMEasurement, "timestamp": int(time.time()*1000) }
    db.child("heartrate").child(uuid).set(vital, token=user['idToken'])

    #ElasticSearch
    doc = {
        'num': HRMEasurement,
        'uuid': uuid,
        'timestamp': datetime.now()
    }
    res = es.index(index="heartrate", doc_type='vital', body=doc)
    
    if flag==0:
        if initialTime!=0:
            # dataHrList=[]
            currentMode=1
            initialTime=int(time.time())
            endTime = initialTime + (int(timeDuration)*60)
            # dataHrList.append("hr,timeStamp")
        else:
            dataHrList.append(str(HRMEasurement) + "," + str(time.time()) + "," + str(int(time.time()*1000)))
            # message = str(HRMEasurement) + "," + str(time.time()) + "," + str(int(time.time()*1000))
            # pubSocket = zmq.Context().socket(zmq.PUB)
            # pubSocket.bind(4003)
            # msg = {"message": 1}
            # topicfilter = "heartRate"
            # pubSocket.send_string("%s %s" % (topicfilter,json.dumps(msg)))

            # if int(time.time())>endTime:
            #     endProcess("hrOutput_" + str(time.time()) + ".csv", dataHrList, 1000)


requests = zmq.Context().socket(zmq.PULL)
requests.bind('tcp://137.132.165.161:5566')

def main():
    global flag, done, ctHR, currentCharac, currentUUID, sensor, sourceAx, sourceAy, sourceAz, sourceAx2, sourceAy2, sourceAz2 
    print(len(dataQueue))

    while len(dataQueue) > 0:
        # ct+=4
        ctHR+=1000
        x = dataQueue.popleft()
        # d = x['uuid']
        # print ("UUID:" + str(d))
        e = x['characteristic']
        # print (e)
        # if d==currentUUID:
            # if e==currentCharac:
        # if sensor==1: 
            # if e== "fff1":
        # if e == "fff1":
        #     homeRehab(x)
        # elif e == "b4994c579754":
        #     homeRehab2(x)
        # elif sensor==2:
        #     if e== "fff1":
        #         homeRehab2(x)
        if e== "2a37":
            heartRate(x)
        if e=="fff4":
            ecgSensor(x)
            # homeRehab(x)
        else:
            print("Service not supported")
            # else:
            #     print("Characteristic not found")


def dataReceive():
    global dataQueue
    global currentCharac, currentUUID, currentMode, dataEcgList, dataHrList, dataHomeList, endTime, currentMode, timeQueue, button, sensor

    # print("123")
    while True:
        try:
            # print("len(dataQueue)")
            # print ("sensor: " + str(sensor))
            x = requests.recv_json()
            if x['uuid'] == currentUUID and x['characteristic']==currentCharac:
                dataQueue.append(x)
                timeQueue.append(int(time.time()*1000))
            elif currentMode!=0:
                dataQueue.append(x)

            
            if int(time.time())>endTime:
                if currentMode!=0:
                    endProcess()
                    print ("Writing to file")
        except (KeyboardInterrupt):
            # print ("Hello")
            endProcess()
            # endProcess("ecg1Output_" + str(time.time()) + ".csv", dataEcgList,4)
            # endProcess("homeOutput_" + str(time.time()) + ".csv", dataHomeList,20)
            # endProcess("hrOutput_" + str(time.time()) + ".csv", dataHrList, 1000)
            # raise
                

t1 = threading.Thread(target=dataReceive)
t1.setDaemon(True)
t1.start()

# def writeToFiles():
#     global ecgFile, homeFile, hrFile, dataHrList, dataHomeList, dataEcgList

#     while True:
#         if len(dataEcgList) != 0:
#             data = dataEcgList.popleft()
#             ecgFile.write(data + '\n')
#         if len(dataHomeList) != 0:
#             homeFile.write(str(dataHomeList.popleft()) + '\n')
#         if len(dataHrList) != 0: 
#             hrFile.write(str(dataHrList.popleft()) + '\n')

# t2 = threading.Thread(target=homeRehab)
# t2.setDaemon(True)
# t2.start()

# t3 = threading.Thread(target=ecgSensor)
# t3.setDaemon(True)
# t3.start()

# t4 = threading.Thread(target=heartRate)
# t4.setDaemon(True)
# t4.start()

curdoc().add_root(column(row(ticker1, ticker2, duration, button), row(fig1, fig3), figH))
curdoc().add_periodic_callback(main,50)


                    
