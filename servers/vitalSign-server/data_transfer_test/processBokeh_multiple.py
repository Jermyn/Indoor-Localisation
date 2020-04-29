import time
import json 
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
import pdb

from bokeh.io import curdoc
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show, output_file
from bokeh.layouts import row, column, gridplot, layout
from bokeh.models.widgets import PreText,Select, Button, Panel, Tabs, TextInput, Toggle
from bokeh.resources import INLINE
# from ipywidgets import interact
from collections import deque

dataQueue = deque()
timeQueue = deque()
deviceQueue = {'ECG':[], 'ACC':[], 'HR':[]}
dataHomeList = []
dataEcgList = []
dataHrList = []
dataEcgList.append("ecg1Sample1,ecg1Sample2,ecg2Sample1,ecg2Sample2,ResRate1Sample1,ResRate1Sample2,ResRate2Sample1,ResRate2Sample2,timeStamp,sysTime")
dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp,sysTime")
dataHrList.append("hr,timeStamp,sysTime")

uuid=[]
charac=[]
devices = []
cache={}
ct=0
accCt=0
ecgCt=0
rrCt=0
ctHR=0
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
portNoList = []
gattPort = {}
whichPort = {}
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
sourceAx_imu0 = ColumnDataSource(dict(x=[],y=[]))
sourceAy_imu0 = ColumnDataSource(dict(x=[],y=[]))
sourceAz_imu0 = ColumnDataSource(dict(x=[],y=[]))
sourceAx_imu1 = ColumnDataSource(dict(x=[],y=[]))
sourceAy_imu1 = ColumnDataSource(dict(x=[],y=[]))
sourceAz_imu1 = ColumnDataSource(dict(x=[],y=[]))
# imu_dict = {'imu0': [sourceAx, sourceAy, sourceAz], 'imu1': [sourceAx, sourceAy, sourceAz]}

sourceMx = ColumnDataSource(dict(x=[],y=[]))
sourceMy = ColumnDataSource(dict(x=[],y=[]))
sourceMz = ColumnDataSource(dict(x=[],y=[]))

sourceGx = ColumnDataSource(dict(x=[],y=[]))
sourceGy = ColumnDataSource(dict(x=[],y=[]))
sourceGz = ColumnDataSource(dict(x=[],y=[]))

sourceHR = ColumnDataSource(dict(x=[],y=[]))
sourceHR0 = ColumnDataSource(dict(x=[],y=[]))
sourceHR1 = ColumnDataSource(dict(x=[],y=[]))
sourceHR2 = ColumnDataSource(dict(x=[],y=[]))

source0 = ColumnDataSource(dict(x=[],y=[]))
source1 = ColumnDataSource(dict(x=[],y=[]))
source2 = ColumnDataSource(dict(x=[],y=[]))
source3 = ColumnDataSource(dict(x=[],y=[]))

source4 = ColumnDataSource(dict(x=[],y=[]))
sourceECG = ColumnDataSource(dict(x=[],y=[]))
sourceECG2 = ColumnDataSource(dict(x=[],y=[]))
sourceECG3 = ColumnDataSource(dict(x=[],y=[]))
sourceECG4 = ColumnDataSource(dict(x=[],y=[]))
sourceRR = ColumnDataSource(dict(x=[], y=[]))
sourceECGAx = ColumnDataSource(dict(x=[], y=[]))
sourceECGAy = ColumnDataSource(dict(x=[], y=[]))
sourceECGAz = ColumnDataSource(dict(x=[], y=[]))
sourceNewECGAx = ColumnDataSource(dict(x=[], y=[]))
sourceNewECGAy = ColumnDataSource(dict(x=[], y=[]))
sourceNewECGAz = ColumnDataSource(dict(x=[], y=[]))

fig=figure(plot_width=700, plot_height=400, title="Acceleration")
fig.line(source=sourceAx, x='x', y='y', line_width=2, alpha=.85, color='red')
fig.line(source=sourceAy, x='x', y='y', line_width=2, alpha=.65, color='blue')
fig.line(source=sourceAz, x='x', y='y', line_width=2, alpha=.45, color="green")
# fig.line(source=sourceMx, x='x', y='y', line_width=2, alpha=.85, color='blue')
# fig.line(source=sourceMy, x='x', y='y', line_width=2, alpha=.65, color='blue')
# fig.line(source=sourceMz, x='x', y='y', line_width=2, alpha=.45, color='blue')
# fig.line(source=sourceGx, x='x', y='y', line_width=2, alpha=.85, color='green')
# fig.line(source=sourceGy, x='x', y='y', line_width=2, alpha=.65, color='green')
# fig.line(source=sourceGz, x='x', y='y', line_width=2, alpha=.45, color='green')
# figAcc=figure(plot_width=700, plot_height=400, title="Acceleration")
# figAcc.line(source=sourceAx2, x='x', y='y', line_width=2, alpha=.85, color='red')
# figAcc.line(source=sourceAy2, x='x', y='y', line_width=2, alpha=.65, color='blue')
# figAcc.line(source=sourceAz2, x='x', y='y', line_width=2, alpha=.45, color="green")
fig_imu0=figure(plot_width=700, plot_height=400, title="Acceleration for IMU0")
fig_imu0.line(source=sourceAx_imu0, x='x', y='y', line_width=2, alpha=.85, color='red')
fig_imu0.line(source=sourceAy_imu0, x='x', y='y', line_width=2, alpha=.65, color='blue')
fig_imu0.line(source=sourceAz_imu0, x='x', y='y', line_width=2, alpha=.45, color="green")
fig_imu1=figure(plot_width=700, plot_height=400, title="Acceleration for IMU1")
fig_imu1.line(source=sourceAx_imu1, x='x', y='y', line_width=2, alpha=.85, color='red')
fig_imu1.line(source=sourceAy_imu1, x='x', y='y', line_width=2, alpha=.65, color='blue')
fig_imu1.line(source=sourceAz_imu1, x='x', y='y', line_width=2, alpha=.45, color="green")
l0 = layout([[fig_imu0, fig_imu1]], sizing_mode='fixed')
tab1 = Panel(child=l0, title="Acceleration")
# figAcc.line(source=sourceMx2, x='x', y='y', line_width=2, alpha=.85, color='blue')
# figAcc.line(source=sourceMy2, x='x', y='y', line_width=2, alpha=.65, color='blue')
# figAcc.line(source=sourceMz2, x='x', y='y', line_width=2, alpha=.45, color='blue')
# figAcc.line(source=sourceGx2, x='x', y='y', line_width=2, alpha=.85, color='green')
# figAcc.line(source=sourceGy2, x='x', y='y', line_width=2, alpha=.65, color='green')
# figAcc.line(source=sourceGz2, x='x', y='y', line_width=2, alpha=.45, color='green')

# figH=figure(plot_width=700, plot_height=400, title="Heart Rate")
# figH.line(source=sourceHR, x='x', y='y', line_width=2, alpha=.85, color='red')
figHR0=figure(plot_width=700, plot_height=400, title="Heart Rate for HR0")
figHR0.line(source=sourceHR0, x='x', y='y', line_width=2, alpha=.85, color='red')
figHR1=figure(plot_width=700, plot_height=400, title="Heart Rate for HR1")
figHR1.line(source=sourceHR1, x='x', y='y', line_width=2, alpha=.85, color='red')
figHR2=figure(plot_width=700, plot_height=400, title="Heart Rate for HR2")
figHR2.line(source=sourceHR2, x='x', y='y', line_width=2, alpha=.85, color='red')

fig0=figure(plot_width=700, plot_height=400, title="ECG 1")
fig0.line(source=source0, x='x', y='y', line_width=2, alpha=.85, color='red')

fig1=figure(plot_width=700, plot_height=400, title="ECG 2")
fig1.line(source=source1, x='x', y='y', line_width=2, alpha=.85, color='red')
figECGAcc = figure(plot_width=700, plot_height=400, title="Acceleration for ECG")
figECGAcc.line(source=sourceECGAx, x='x', y='y', line_width=2, alpha=.85, color='red')
figECGAcc.line(source=sourceECGAy, x='x', y='y', line_width=2, alpha=.65, color='blue')
figECGAcc.line(source=sourceECGAz, x='x', y='y', line_width=2, alpha=.45, color="green")

figNewECG = figure(plot_width=700, plot_height=400, title="New ECG", y_range=(0, 4000))
figNewECG.line(source=sourceECG, x='x', y='y', line_width=2, alpha=.85, color='red')
figNewECG.line(source=sourceECG2, x='x', y='y', line_width=2, alpha=.85, color='blue')
figNewECG.line(source=sourceECG3, x='x', y='y', line_width=2, alpha=.85, color='green')
figNewECG.line(source=sourceECG4, x='x', y='y', line_width=2, alpha=.85, color='black')
figNewRR = figure(plot_width=700, plot_height=400, title="Respiration for New ECG", y_range=(0, 1500), x_range=figNewECG.x_range)
figNewRR.line(source=sourceRR, x='x', y='y', line_width=2, alpha=.85, color='blue')
figNewECGAcc = figure(plot_width=700, plot_height=400, title="Acceleration for New ECG", y_range=(0, 400), x_range=figNewECG.x_range)
figNewECGAcc.line(source=sourceNewECGAx, x='x', y='y', line_width=2, alpha=.85, color='red')
figNewECGAcc.line(source=sourceNewECGAy, x='x', y='y', line_width=2, alpha=.65, color='blue')
figNewECGAcc.line(source=sourceNewECGAz, x='x', y='y', line_width=2, alpha=.45, color="green")

fig2=figure(plot_width=700, plot_height=400, title="Respiration 1")
fig2.line(source=source2, x='x', y='y', line_width=2, alpha=.85, color='blue')

fig3=figure(plot_width=700, plot_height=400, title="Respiration 2")
fig3.line(source=source3, x='x', y='y', line_width=2, alpha=.85, color='blue')

fig4=figure(plot_width=700, plot_height=400, title="heart beat")
fig4.line(source=source4, x='x', y='y', line_width=2, alpha=.85, color='blue')

l1 = layout([[fig1, fig3],
            [figECGAcc]], sizing_mode='fixed')
l2 = layout([[figHR0, figHR1],
            [figHR2]], sizing_mode='fixed')
l3 = layout([[figNewECG, figNewRR],
            [figNewECGAcc]], sizing_mode='fixed')
tab2 = Panel(child=l2, title="Heart Rate")
tab3 = Panel(child=l1, title="ECG")
tab4 = Panel(child=l3, title="New ECG")

labelValue=" "
# Loss = "No Data Loss"
anchorTransmittedFrom = TextInput(value=labelValue, title="Sent by Anchor:", width = 100)

# toggle = Toggle(label=Loss, button_type="primary", name="Data Loss", active=False)

def dynamicGraphs(deviceId):
    global deviceQueue, cache, devices
    for device, info in cache['devices'].items():
        if cache['devices'][device]['type'] == 'mobile' and cache['devices'][device]['gatt'] != None:
            # print (info['gatt']['id'], info['id'])
            if info['gatt']['id'] == deviceId:
                return info['id']
    # return (devices)
    # print (deviceQueue)

def openPort(portArr):
    global portNoList
    for key, val in portArr.items():
        if val['portNo'] not in portNoList:
            portNoList.append(val['portNo'])
            gattPort[key] = zmq.Context().socket(zmq.PULL)
            gattPort[key].bind('tcp://137.132.165.139:' + str(val['portNo']))
    return gattPort

def readAndStoreData(data):
    global dataQueue
    print (data)
    # gatt = whichPort[gattDev].recv_json()
    # print (gatt)
    if (data['uuid'] == currentUUID and data['characteristic']==currentCharac) or currentMode !=0:
        dataQueue.append(data)

def updateCache():
    requests = zmq.Context().socket(zmq.REQ)
    requests.connect('tcp://137.132.165.139:5570')
    global cache
    requests.send_string("CACHE_REQUEST")
    cache = requests.recv_json()
    # for device, info in cache['devices'].items():
    #     if cache['devices'][device]['type'] == 'mobile' and cache['devices'][device]['gatt'] != None:
    #         print (info)
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
    print ('Duration:' + timeDuration)
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
    

    write_file =str("01_ECG" + str(int(time.time())) + ".csv")
    with open(write_file, "w") as output:
        for line in dataEcgList:
            output.write(line + '\n')
    dataEcgList=[]
    print("Saved to ECG file")

    write_file =str("01_Home" + str(int(time.time())) + ".csv")
    with open(write_file, "w") as output:
        for line in dataHomeList:
            output.write(line + '\n')
    dataHomeList=[]
    print("Saved to Home file")

    write_file =str("01_HR" + str(int(time.time())) + ".csv")
    with open(write_file, "w") as output:
        for line in dataHrList:
            output.write(line + '\n')
    dataHrList=[]
    print("Saved to Hr file")

    dataEcgList.append("ecg1Sample1,ecg1Sample2,ecg2Sample1,ecg2Sample2,ResRate1Sample1,ResRate1Sample2,ResRate2Sample1,ResRate2Sample2,timeStamp,sysTime, timeQueue, id")
    dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp,sysTime, id")
    dataHrList.append("hr,timeStamp,sysTime, id")

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
    global ct, accCt, initialTime, endTime, dataEcgList, timeDuration, currentMode, previousSequenceNumber, timeQueue, previousTimeStamp, dataHrList, dataHomeList
    global timer,beat,count,hpf,time10s, hpfr

    d = base64.b64decode(x['data']) #x['data'].decode('base64')
    data=bytearray(d)
    # print (x['data'], d, len(data), data[0])


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
            accCt += (256-previousSequenceNumber + sequenceNumber)*16
        else:
            ct += (sequenceNumber-previousSequenceNumber)*4
            accCt += (sequenceNumber-previousSequenceNumber)*16

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

    accX = int(data[17])
    accY = int(data[18])
    accZ = int(data[19])
    # print (accX, accY, accZ)

    new_dataAccx = dict(x=[accCt],y=[accX])
    sourceECGAx.stream(new_dataAccx,100)
    new_dataAccy = dict(x=[accCt],y=[accY])
    sourceECGAy.stream(new_dataAccy,100)
    new_dataAccz = dict(x=[accCt],y=[accZ])
    sourceECGAz.stream(new_dataAccz,100)

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

    if flag==0:
        if initialTime ==0:
            currentMode=1
            initialTime=int(time.time())
            endTime = initialTime + (5*60) 
        else:
            dataEcgList.append(str(ecg1Sample1) + "," + str(ecg1Sample2) + "," + str(ecg2Sample1) + "," + str(ecg2Sample2) + "," + str(ResRate1Sample1) + "," + str(ResRate1Sample2) + "," + str(ResRate2Sample1) + "," + str(ResRate2Sample2) + "," + str(ct) + "," + str(int(time.time()*1000)) + "," + str(currentTimeStamp) + "," + str(x['uuid']))
            # if int(time.time())>endTime:
            #     print ("Writing to file")
                # endProcess("ecg1Output_" + str(time.time()) + ".csv", dataEcgList,4)
                # endProcess()

def newEcgSensor(x):
    global ct, accCt, ecgCt, rrCt, initialTime, endTime, dataEcgList, timeDuration, currentMode, previousSequenceNumber, timeQueue, previousTimeStamp, dataHrList, dataHomeList
    global timer,beat,count,hpf,time10s, hpfr

    d = base64.b64decode(x['data']) #x['data'].decode('base64')
    data=bytearray(d)

    # print (x['data'], d, len(data))

    currentTimeStamp = timeQueue.popleft()

    if previousTimeStamp != None: 
        if (previousTimeStamp - currentTimeStamp) >= 1000:
            ct+=(previousTimeStamp - currentTimeStamp)

    previousTimeStamp = currentTimeStamp

    sequenceNumber = data[0]
    # print (sequenceNumber)

    if previousSequenceNumber is None:
        ct = 0
    else:
        if previousSequenceNumber> sequenceNumber:
            ct += (256-previousSequenceNumber + sequenceNumber)*4
            accCt += (256-previousSequenceNumber + sequenceNumber)*16
        else:
            ct += (sequenceNumber-previousSequenceNumber)*4
            accCt += (sequenceNumber-previousSequenceNumber)*16

    previousSequenceNumber = sequenceNumber
    # print (sequenceNumber, accCt, ct)
    

    ecgSample1 = (0x00ff & data[1])<<8 | (data[2] & 0x00ff)
    ecgSample2 = (0x00ff & data[3])<<8 | (data[4] & 0x00ff)
    ecgSample3 = (0x00ff & data[5])<<8 | (data[6] & 0x00ff)
    ecgSample4 = (0x00ff & data[7])<<8 | (data[8] & 0x00ff)
    ecgSample = [ecgSample1, ecgSample2, ecgSample3, ecgSample4]
    print (ecgSample)

    ResRateSample1 = (0x00ff & data[9])<<8 | (data[10] & 0x00ff)
    ResRateSample2 = (0x00ff & data[11])<<8 | (data[12] & 0x00ff)
    ResRateSample3 = (0x00ff & data[13])<<8 | (data[14] & 0x00ff)
    ResRateSample4 = (0x00ff & data[15])<<8 | (data[16] & 0x00ff)
    resSample = [ResRateSample1, ResRateSample2, ResRateSample3, ResRateSample4]
    print (resSample)
    # print (resSample[rrCt])

    accX = data[17]
    accY = data[18]
    accZ = data[19]
    acc = math.sqrt((accX**2) + (accY**2) + (accZ**2))
    # print (accX, accY, accZ)
    # print (acc)

    # new_dataAccx = dict(x=[accCt],y=[acc])
    # sourceNewECGAx.stream(new_dataAccx,100)
    # new_dataAccy = dict(x=[accCt],y=[accY])
    # sourceNewECGAy.stream(new_dataAccy,100)
    # new_dataAccz = dict(x=[accCt],y=[accZ])
    # sourceNewECGAz.stream(new_dataAccz,100)

    new_dataECG1 = dict(x=[ct], y=[ecgSample1])
    sourceECG.stream(new_dataECG1, 100)
    new_dataRR1 = dict(x=[ct], y=[ResRateSample1])
    sourceRR.stream(new_dataRR1, 100)
    new_dataECG2 = dict(x=[2 * ct], y=[ecgSample2])
    sourceECG2.stream(new_dataECG2, 100)
    new_dataRR2 = dict(x=[2 * ct], y=[ResRateSample2])
    sourceRR.stream(new_dataRR2, 100)
    new_dataECG3 = dict(x=[3 * ct], y=[ecgSample3])
    sourceECG3.stream(new_dataECG3, 100)
    new_dataRR3 = dict(x=[3 * ct], y=[ResRateSample3])
    sourceRR.stream(new_dataRR3, 100)
    new_dataECG4 = dict(x=[accCt], y=[ecgSample4])
    sourceECG4.stream(new_dataECG4, 100)
    new_dataRR4 = dict(x=[accCt], y=[ResRateSample4])
    sourceRR.stream(new_dataRR4, 100)
    new_dataAccx = dict(x=[accCt],y=[acc])
    sourceNewECGAx.stream(new_dataAccx,400)

    if ecgCt < 3 and rrCt < 3: 
        ecgCt += 1
        rrCt += 1
    else:
        ecgCt = 0
        rrCt = 0

    # ecg1Sample = ecg1Sample1<<16 | ecg1Sample2
    # ecg2Sample = ecg2Sample1<<16 | ecg2Sample2

    # res1Sample = ResRate1Sample1<<16 | ResRate1Sample2
    # res2Sample = ResRate2Sample1<<16 | ResRate2Sample2

    # new_data0 = dict(x=[ct],y=[ecg1Sample])
    # source0.stream(new_data0,1000)
    # ecg2Sample = ecg2Sample/10000000

    

    # if len(hpf)<151:
    #     hpf.append(float(ecg2Sample))
    #     hpfr.append(res2Sample)
    # else:
    #     if(int(time.time())*1000)>=time10s:
    #         time10s+=5000
    #         new_data4 = dict(x=[ct],y=[beat*6])
    #         source4.stream(new_data4,1000)
    #         beat=0
    #     hpf[150]=ecg2Sample
    #     hpfr[150] = res2Sample
    #     hrPoint=0
    #     resPoint = 0
    #     j=0
    #     while j<len(hpf):
    #         hrPoint+=hpf[j]*float(filter_taps[j])
    #         resPoint += hpfr[j]*float(filter_taps[j])
    #         j+=1
    #     newHrPoint = math.pow(hrPoint,2)
    #     if newHrPoint>1:
    #         beat+=1
    #     new_data1 = dict(x=[ct],y=[newHrPoint])
    #     source1.stream(new_data1,1000)
    #     new_data3 = dict(x=[ct],y=[resPoint])
    #     source3.stream(new_data3,1000)
    #     hpf.pop(0)
    #     hpf.append(0)
    #     hpfr.pop(0)
    #     hpfr.append(0)

    # new_data2 = dict(x=[ct],y=[res1Sample])
    # source2.stream(new_data2,1000)

    # new_data3 = dict(x=[ct],y=[res2Sample])
    # source3.stream(new_data3,1000)

    if flag==0:
        if initialTime ==0:
            currentMode=1
            initialTime=int(time.time())
            endTime = initialTime + (int(timeDuration)*60)
    #     else:
    #         dataEcgList.append(str(ecg1Sample1) + "," + str(ecg1Sample2) + "," + str(ecg2Sample1) + "," + str(ecg2Sample2) + "," + str(ResRate1Sample1) + "," + str(ResRate1Sample2) + "," + str(ResRate2Sample1) + "," + str(ResRate2Sample2) + "," + str(ct) + "," + str(int(time.time()*1000)) + "," + str(currentTimeStamp) + "," + str(x['uuid']))
    #         if int(time.time())>endTime:
    #             print ("Writing to file")
    #             endProcess("ecg1Output_" + str(time.time()) + ".csv", dataEcgList,4)
    #             endProcess()


        
def homeRehab(x, sensorid):
    global initialTime, endTime, dataHomeList, timeDuration, currentMode, flag
    # print (sensorid, imu_dict[sensorid])
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
    # Ax.stream(new_dataAx,100)
    # sourceAx.stream(new_dataAx,100)
    new_dataAy = dict(x=[timestamp],y=[accY])
    # Ay.stream(new_dataAy,100)
    # sourceAy.stream(new_dataAy,100)
    new_dataAz = dict(x=[timestamp],y=[accZ])
    # Az.stream(new_dataAz,100)
    # sourceAz.stream(new_dataAz,100)
    if sensorid == 'imu0':
        sourceAx_imu0.stream(new_dataAx,100)
        sourceAy_imu0.stream(new_dataAy,100)
        sourceAz_imu0.stream(new_dataAz,100)
    elif sensorid == 'imu1':
        sourceAx_imu1.stream(new_dataAx,100)
        sourceAy_imu1.stream(new_dataAy,100)
        sourceAz_imu1.stream(new_dataAz,100)

    print("HOME REHAB")
    # fig=figure(plot_width=700, plot_height=400, title="Acceleration")
    # fig.line(source=Ax, x='x', y='y', line_width=2, alpha=.85, color='red')
    # fig.line(source=Ay, x='x', y='y', line_width=2, alpha=.65, color='blue')
    # fig.line(source=Az, x='x', y='y', line_width=2, alpha=.45, color="green")

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
    # print ('flag, initialTime:', flag, initialTime)
    if flag==0:
        if initialTime == 0:
            initialTime=int(time.time())
            endTime = initialTime + (int(timeDuration)*60)
            # dataHomeList=[]
            currentMode=1
            # initialTime=int(time.time())
            # endTime = initialTime + (int(5)*60)*1000
            # dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp")
            # print("start")
        else:
            dataHomeList.append(str(accX) + "," + str(accY) + "," + str(accZ) + "," + str(magX) + "," + str(magY) + "," + str(magZ) + "," + str(gyroX) + "," + str(gyroY) + "," + str(gyroZ) + "," + str(timestamp) + "," + str(int(time.time()*1000)) + "," + str(x['uuid']))
            # if timestamp>endTime:
            #     endProcess()
            #     print("Writing to file")
            #     endProcess("homeOutput_" + str(time.time()) + ".csv", dataHomeList,20)
    

def heartRate(x, sensorid):
    global ctHR, flag, dataHrList, initialTime, endTime, timeDuration, currentMode
    d = base64.b64decode(x['data'])
    data=bytearray(d)
    HRMEasurement = (data[1] + 2**15) % 2**16 - 2**15
    print (HRMEasurement)


    new_dataHR = dict(x=[ctHR],y=[HRMEasurement])
    if sensorid == 'hr0':
        sourceHR0.stream(new_dataHR,100)
    elif sensorid == 'hr1':
        sourceHR1.stream(new_dataHR,100)
    elif sensorid == 'hr2':
        sourceHR2.stream(new_dataHR,100)

    if flag==0:
        if initialTime==0:
            # dataHrList=[]
            currentMode=1
            initialTime=int(time.time())
            endTime = initialTime + (int(timeDuration)*60)
            # dataHrList.append("hr,timeStamp")
        else:
            dataHrList.append(str(HRMEasurement) + "," + str(time.time()) + "," + str(int(time.time()*1000)) + "," + str(x['uuid']))
            # if int(time.time())>endTime:
            #     endProcess("hrOutput_" + str(time.time()) + ".csv", dataHrList, 1000)

# requests = zmq.Context().socket(zmq.PULL)
# requests.bind('tcp://137.132.165.139:5566')
# port = zmq.Context().socket(zmq.PULL)
# port.bind('tcp://137.132.165.139:5555')
hr0 = zmq.Context().socket(zmq.PULL)
hr0.bind('tcp://137.132.165.139:8000')
hr1 = zmq.Context().socket(zmq.PULL)
hr1.bind('tcp://137.132.165.139:8001')
hr2 = zmq.Context().socket(zmq.PULL)
hr2.bind('tcp://137.132.165.139:8002')
imu0 = zmq.Context().socket(zmq.PULL)
imu0.bind('tcp://137.132.165.139:6000')
imu1 = zmq.Context().socket(zmq.PULL)
imu1.bind('tcp://137.132.165.139:6001')
# imu3 = zmq.Context().socket(zmq.PULL)
# imu3.bind('tcp://137.132.165.139:6003')
# imu4 = zmq.Context().socket(zmq.PULL)
# imu4.bind('tcp://137.132.165.139:6004')

def main():
    global flag, done, ctHR, currentCharac, devices, labelValue, deviceQueue, currentUUID, sensor, sourceAx, sourceAy, sourceAz, sourceAx2, sourceAy2, sourceAz2 
    # print(len(dataQueue))
    # print (deviceQueue)

    while len(dataQueue) > 0:
        # ct+=4
        ctHR+=1000
        x = dataQueue.popleft()
        sensorid = dynamicGraphs(x['uuid'])
        if sensorid not in devices:
            devices.append(sensorid)
        anchorTransmittedFrom.value = x['anchorId']
        e = x['characteristic']
        if e == "fff1":
            homeRehab(x, sensorid)
        if e== "2a37":
            heartRate(x, sensorid)
        if e=="fff4":
            if x['uuid'] == '5c313e8c2eec':
                newEcgSensor(x)
            else:
                ecgSensor(x)
        else:
            print("Service not supported")
            # else:
            #     print("Characteristic not found")


def portReceieve():
    global dataQueue, deviceQueue, whichPort
    global currentCharac, currentUUID, currentMode, dataEcgList, dataHrList, dataHomeList, endTime, timeQueue, button, sensor

    # print("123")
    while True:
        try:
            portInfo = port.recv_json()
            # print (portInfo)
            whichPort = openPort(portInfo)
            # hr0Data = hr0.recv_json()
            # readAndStoreData(hr0Data)
            # hr1Data = hr1.recv_json()
            # readAndStoreData(hr1Data)
            # hr2Data = hr2.recv_json()
            # readAndStoreData(hr2Data)
            # timeQueue.append(int(time.time()*1000))
            # print ("Current Mode: ", currentMode)
            # print (x['uuid'])


            # if x['uuid'] == currentUUID and x['characteristic']==currentCharac:
            #     if x['characteristic'] == "fff1" and x['uuid'] not in deviceQueue['ACC']:
            #         deviceQueue['ACC'].append(x['uuid'])
            #     elif x['characteristic'] == "fff4" and x['uuid'] not in deviceQueue['ECG']:
            #         deviceQueue['ECG'].append(x['uuid'])
            #     elif x['characteristic'] == "2a37" and x['uuid'] not in deviceQueue['HR']:
            #         deviceQueue['HR'].append(x['uuid'])
                # dataQueue.append(x)
            
            # elif currentMode!=0:
            #     dataQueue.append(x)
            #     if x['characteristic'] == "fff1" and x['uuid'] not in deviceQueue['ACC']:
            #         deviceQueue['ACC'].append(x['uuid'])
            #     elif x['characteristic'] == "fff4" and x['uuid'] not in deviceQueue['ECG']:
            #         deviceQueue['ECG'].append(x['uuid'])
            #     elif x['characteristic'] == "2a37" and x['uuid'] not in deviceQueue['HR']:
            #         deviceQueue['HR'].append(x['uuid'])
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

def IMUdataReceive():
    global dataQueue, deviceQueue, whichPort
    global currentCharac, currentUUID, currentMode, dataEcgList, dataHrList, dataHomeList, endTime, timeQueue, button, sensor

    imu0Data = {}
    imu1Data = {}
    # print("123")
    while True:
        try:
            # portInfo = port.recv_json()
            # whichPort = openPort(portInfo)
            # imu0Data = imu0.recv_json()
            # readAndStoreData('imu0')
            try:
                imu0Data = imu0.recv(flags=zmq.NOBLOCK)
                if imu0Data != {}:
                    my_json = imu0Data.decode('utf8').replace("'", '"')
                    data = json.loads(my_json)
                    readAndStoreData(data)
            except zmq.Again as e:
                try:
                    imu1Data = imu1.recv(flags=zmq.NOBLOCK)
                    if imu1Data != {}:
                        my_json = imu1Data.decode('utf8').replace("'", '"')
                        data = json.loads(my_json)
                        readAndStoreData(data)
                except zmq.Again as e:
                    pass
            timeQueue.append(int(time.time()*1000))
            # print ("Current Mode: ", currentMode)
            # print (x['uuid'])


            # if x['uuid'] == currentUUID and x['characteristic']==currentCharac:
            #     if x['characteristic'] == "fff1" and x['uuid'] not in deviceQueue['ACC']:
            #         deviceQueue['ACC'].append(x['uuid'])
            #     elif x['characteristic'] == "fff4" and x['uuid'] not in deviceQueue['ECG']:
            #         deviceQueue['ECG'].append(x['uuid'])
            #     elif x['characteristic'] == "2a37" and x['uuid'] not in deviceQueue['HR']:
            #         deviceQueue['HR'].append(x['uuid'])
                # dataQueue.append(x)
            
            # elif currentMode!=0:
            #     dataQueue.append(x)
            #     if x['characteristic'] == "fff1" and x['uuid'] not in deviceQueue['ACC']:
            #         deviceQueue['ACC'].append(x['uuid'])
            #     elif x['characteristic'] == "fff4" and x['uuid'] not in deviceQueue['ECG']:
            #         deviceQueue['ECG'].append(x['uuid'])
            #     elif x['characteristic'] == "2a37" and x['uuid'] not in deviceQueue['HR']:
            #         deviceQueue['HR'].append(x['uuid'])
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

def HRDataReceive():
    global dataQueue, deviceQueue, whichPort
    global currentCharac, currentUUID, currentMode, dataEcgList, dataHrList, dataHomeList, endTime, timeQueue, button, sensor

    hr0Data = {}
    hr1Data = {}
    hr2Data = {}
    imu0Data = {}
    imu1Data = {}
    data = {}
    # print("123")
    while True:
        try:
            # portInfo = port.recv_json()
            # print (portInfo)
            # whichPort = openPort(portInfo)
            try:
                hr0Data = hr0.recv(flags=zmq.NOBLOCK)
                if hr0Data != {}:
                    my_json = hr0Data.decode('utf8').replace("'", '"')
                    data = json.loads(my_json)
                    readAndStoreData(data)
            except zmq.Again as e:
                try:
                    hr1Data = hr1.recv(flags=zmq.NOBLOCK)
                    if hr1Data != {}:
                        my_json = hr1Data.decode('utf8').replace("'", '"')
                        data = json.loads(my_json)
                        readAndStoreData(data)
                except zmq.Again as e:
                    try:
                        hr2Data = hr2.recv(flags=zmq.NOBLOCK)
                        if hr2Data != {}:
                            my_json = hr2Data.decode('utf8').replace("'", '"')
                            data = json.loads(my_json)
                            readAndStoreData(data)
                    except zmq.Again as e:
                        pass
            try:
                imu0Data = imu0.recv(flags=zmq.NOBLOCK)
                if imu0Data != {}:
                    my_json = imu0Data.decode('utf8').replace("'", '"')
                    data = json.loads(my_json)
                    readAndStoreData(data)
            except zmq.Again as e:
                try:
                    imu1Data = imu1.recv(flags=zmq.NOBLOCK)
                    if imu1Data != {}:
                        my_json = imu1Data.decode('utf8').replace("'", '"')
                        data = json.loads(my_json)
                        readAndStoreData(data)
                except zmq.Again as e:
                    pass
            # readAndStoreData(hr0Data)
            # hr1Data = hr1.recv_json()
            # readAndStoreData(hr1Data)
            # hr2Data = hr2.recv_json()
            # readAndStoreData(hr2Data)
            timeQueue.append(int(time.time()*1000))
            # print ("Current Mode: ", currentMode)
            # print (x['uuid'])


            # if x['uuid'] == currentUUID and x['characteristic']==currentCharac:
            #     if x['characteristic'] == "fff1" and x['uuid'] not in deviceQueue['ACC']:
            #         deviceQueue['ACC'].append(x['uuid'])
            #     elif x['characteristic'] == "fff4" and x['uuid'] not in deviceQueue['ECG']:
            #         deviceQueue['ECG'].append(x['uuid'])
            #     elif x['characteristic'] == "2a37" and x['uuid'] not in deviceQueue['HR']:
            #         deviceQueue['HR'].append(x['uuid'])
                # dataQueue.append(x)
            
            # elif currentMode!=0:
            #     dataQueue.append(x)
            #     if x['characteristic'] == "fff1" and x['uuid'] not in deviceQueue['ACC']:
            #         deviceQueue['ACC'].append(x['uuid'])
            #     elif x['characteristic'] == "fff4" and x['uuid'] not in deviceQueue['ECG']:
            #         deviceQueue['ECG'].append(x['uuid'])
            #     elif x['characteristic'] == "2a37" and x['uuid'] not in deviceQueue['HR']:
            #         deviceQueue['HR'].append(x['uuid'])
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


                
# t0 = threading.Thread(target=portReceieve)
# t0.setDaemon(True)
# t0.start()

# t1 = threading.Thread(target=IMUdataReceive)
# t1.setDaemon(True)
# t1.start()

t2 = threading.Thread(target=HRDataReceive)
t2.setDaemon(True)
t2.start()
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

tabs = Tabs(tabs=[tab1, tab2, tab3, tab4])

l = layout([ticker1, ticker2, duration, button],
            [anchorTransmittedFrom],
            [tabs])

curdoc().add_root(l)
# curdoc().add_root(column(row(ticker1, ticker2, duration, button, anchorTransmittedFrom), tabs))
# curdoc().add_root(column(row(ticker1, ticker2, duration, button), row(fig1, fig3), row(fig, figH)))
curdoc().add_periodic_callback(main,50)


                    
