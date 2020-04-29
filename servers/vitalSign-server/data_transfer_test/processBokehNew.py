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
import pyrebase

from bokeh.io import curdoc
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show, output_file
from bokeh.layouts import row, column, gridplot
from bokeh.models.widgets import PreText,Select, Button
from bokeh.resources import INLINE
# from urllib import requests
# from ipywidgets import interact
from collections import deque

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

filter_tapsR = ([
    -0.005727232304733316,-0.0016210535109596879,-0.0018367135455779507,-0.0020606383352353235,-0.0022918464898055066,-0.0025284521965344025,
    -0.0027689461377858595,-0.003011667684367667,-0.003254668130437869,-0.0034959887622586987,-0.0037334656761444183,-0.003964634859823514,
    -0.004187174533726186,-0.004399009242115698,-0.004597966749846134,-0.004781663251649966,-0.004947736218914266,-0.005093947945590077,
    -0.005218233655794386,-0.005318820635587699,-0.005394046727083362,-0.005442053121731869,-0.005461123617114412,-0.005450369829986653,
    -0.005409389463725137,-0.005337345240706743,-0.0052332828368975935,-0.005097449124974988,-0.004930893244108929,-0.004733621375506668,
    -0.004505649389110405,-0.0042508891645634175,-0.003967628944824048,-0.003660738210606969,-0.0033304159500042976,-0.0029807983531311413,
    -0.0026139172559825796,-0.0022330319616438907,-0.0018419777696242956,-0.001444348731166091,-0.0010439642159485037,-0.0006451146317321369,
    -0.00025203783270783887,0.00013111615057595133,0.0004999056417436945,0.000849755577958471,0.0011764605645879897,0.001476040905651507,
    0.0017443392441173987,0.0019772332796168537,0.002171063572031559,0.0023225089208844868,0.0024283354673991057,0.0024856233893475062,
    0.0024919428805788677,0.002445199587075268,0.0023437223598793086,0.0021866588936873942,0.0019737056383010965,0.0017046997305847256,
    0.0013802831607211054,0.0010023954924590589,0.0005716977382388002,0.0000933489600954547,-0.00043473050002173884,-0.0010020984960956724,
    -0.0016109804888384516,-0.0022546623818720515,-0.0029263758756168027,-0.0036217535295100384,-0.004335746218091549,-0.005061090256236979,
    -0.0057899029069995575,-0.0065151295891967284,-0.007230102188186325,-0.007927647151393552,-0.008600157353402572,-0.009240000771722011,
    -0.009839682760963604,-0.010391892476413398,-0.010889437007990221,-0.011324996249060037,-0.011691245359275912,-0.011981576612905559,
    -0.012190604625208093,-0.012313917806444325,-0.012347479282377878,-0.01228708622438471,-0.012127999553147448,-0.011865863836890641,
    -0.011499144908282913,-0.011030157022793587,-0.01046114912944249,-0.009787436484455776,-0.009000113454935508,-0.008128836753360234,
    -0.007150832589104173,-0.006083948465731433,-0.004928386019756673,-0.0036909128682181985,-0.00237775425538407,-0.000996196380432642,
    0.000445648074182488,0.0019394164634500832,0.0034761836680407337,0.005046221510266203,0.0066394621991402855,0.008245727554621617,
    0.009854579191646224,0.011455337838809952,0.013037249446294303,0.014589424850064866,0.01610094707999993,0.017561312420550982,
    0.018960487324418043,0.020288495457514207,0.021535531030678845,0.02269269978218013,0.02375205621438608,0.02470594238335916,
    0.025547081578547955,0.026269486029713504,0.026868231472931232,0.027338493627322016,0.027676494853665173,0.02788118620267277,
    0.027948800686230162,0.02788118620267277,0.027676494853665173,0.027338493627322016,0.026868231472931232,0.026269486029713504,
    0.025547081578547955,0.02470594238335916,0.02375205621438608,0.02269269978218013,0.021535531030678845,0.020288495457514207,
    0.018960487324418043,0.017561312420550982,0.01610094707999993,0.014589424850064866,0.013037249446294303,0.011455337838809952,
    0.009854579191646224,0.008245727554621617,0.0066394621991402855,0.005046221510266203,0.0034761836680407337,0.0019394164634500832,
    0.000445648074182488,-0.000996196380432642,-0.00237775425538407,-0.0036909128682181985,-0.004928386019756673,-0.006083948465731433,
    -0.007150832589104173,-0.008128836753360234,-0.009000113454935508,-0.009787436484455776,-0.01046114912944249,-0.011030157022793587,
    -0.011499144908282913,-0.011865863836890641,-0.012127999553147448,-0.01228708622438471,-0.012347479282377878,-0.012313917806444325,
    -0.012190604625208093,-0.011981576612905559,-0.011691245359275912,-0.011324996249060037,-0.010889437007990221,-0.010391892476413398,
    -0.009839682760963604,-0.009240000771722011,-0.008600157353402572,-0.007927647151393552,-0.007230102188186325,-0.0065151295891967284,
    -0.0057899029069995575,-0.005061090256236979,-0.004335746218091549,-0.0036217535295100384,-0.0029263758756168027,-0.0022546623818720515,
    -0.0016109804888384516,-0.0010020984960956724,-0.00043473050002173884,0.0000933489600954547,0.0005716977382388002,0.0010023954924590589,
    0.0013802831607211054,0.0017046997305847256,0.0019737056383010965,0.0021866588936873942,0.0023437223598793086,0.002445199587075268,
    0.0024919428805788677,0.0024856233893475062,0.0024283354673991057,0.0023225089208844868,0.002171063572031559,0.0019772332796168537,
    0.0017443392441173987,0.001476040905651507,0.0011764605645879897,0.000849755577958471,0.0004999056417436945,0.00013111615057595133,
    -0.00025203783270783887,-0.0006451146317321369,-0.0010439642159485037,-0.001444348731166091,-0.0018419777696242956,-0.0022330319616438907,
    -0.0026139172559825796,-0.0029807983531311413,-0.0033304159500042976,-0.003660738210606969,-0.003967628944824048,-0.0042508891645634175,
    -0.004505649389110405,-0.004733621375506668,-0.004930893244108929,-0.005097449124974988,-0.0052332828368975935,-0.005337345240706743,
    -0.005409389463725137,-0.005450369829986653,-0.005461123617114412,-0.005442053121731869,-0.005394046727083362,-0.005318820635587699,
    -0.005218233655794386,-0.005093947945590077,-0.004947736218914266,-0.004781663251649966,-0.004597966749846134,-0.004399009242115698,
    -0.004187174533726186,-0.003964634859823514,-0.0037334656761444183,-0.0034959887622586987,-0.003254668130437869,-0.003011667684367667,
    -0.0027689461377858595,-0.0025284521965344025,-0.0022918464898055066,-0.0020606383352353235,-0.0018367135455779507,-0.0016210535109596879,
    -0.005727232304733316
 ])

config = {
    "apiKey": "AIzaSyAlYsm1j9uuH-kgJILT6KUWt4ZjHYysKcw",
    "authDomain": "fir-basic-patient.firebaseapp.com",
    "databaseURL": "https://fir-basic-patient.firebaseio.com",
    "projectId": "fir-basic-patient",
    "storageBucket": "fir-basic-patient.appspot.com",
    "messagingSenderId": "284515715601",
    "serviceAccount": './fir-basic-patient-firebase-adminsdk-719ds-adf34bd362.json'
}

threshold = None
def stream_handler(message):
    global threshold

    threshold = message['data']

datalist = []
firebase = pyrebase.initialize_app(config)

auth = firebase.auth()
# #authenticate a user
user = auth.sign_in_with_email_and_password("admin@admin.com", "password")

database = firebase.database()

my_stream = database.child("vitalSign/threshold").stream(stream_handler)
# seqNum = open("storeSeqNum.csv", 'w')

dataQueue = deque()
timeQueue = deque()
dataHomeList = []
dataEcgList = []
dataHrList = []
dataEcgList.append("ecg1Sample1,ecg1Sample2,ecg2Sample1,ecg2Sample2,ResRate1Sample1,ResRate1Sample2,ResRate2Sample1,ResRate2Sample2,timeStamp,sysTime")
dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp,sysTime")
dataHrList.append("hr,timeStamp,sysTime")

uuid=[]
charac=[]
cache={}
ct=0
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

uuid.append('-')
charac.append('-')

source0 = ColumnDataSource(dict(x=[],y=[]))
source1 = ColumnDataSource(dict(x=[],y=[]))
source2 = ColumnDataSource(dict(x=[],y=[]))
source3 = ColumnDataSource(dict(x=[],y=[]))
source4 = ColumnDataSource(dict(x=[],y=[]))

fig0=figure(plot_width=700, plot_height=400, title="ECG 1")
fig0.line(source=source0, x='x', y='y', line_width=2, alpha=.85, color='red')

fig1=figure(plot_width=700, plot_height=400, title="ECG 2")
fig1.line(source=source1, x='x', y='y', line_width=2, alpha=.85, color='red')

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
    currentUUID=new
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

    dataEcgList.append("ecg1Sample1,ecg1Sample2,ecg2Sample1,ecg2Sample2,ResRate1Sample1,ResRate1Sample2,ResRate2Sample1,ResRate2Sample2,timeStamp,sysTime, timeQueue")
    dataHomeList.append("accX,accY,accZ,magX,magY,magZ,gyroX,gyroY,gyroZ,timeStamp,sysTime")
    dataHrList.append("hr,timeStamp,sysTime")

    initialTime=0
    currentMode=0

resHpf = []
def filterRes(res):
    global filter_tapsR, resHpf

    i=0
    if len(resHpf)<150:
        resHpf.append(float(res))
        resPoint = res
    else:
        resHpf[149]=res
        resPoint=0
        j=0
        while j<len(resHpf):
            resPoint+=resHpf[j]*float(filter_tapsR[j])
            j+=1
        # resPoint = math.pow(resPoint,2)
        resHpf.pop(0)
        resHpf.append(0)

    return resPoint

hpf = []
def filterECG(ecg):
    global filter_taps, hpf

    i=0
    if len(hpf)<151:
        hpf.append(float(ecg))
        hrPoint = ecg
    else:
        hpf[150]=ecg
        hrPoint=0
        j=0
        while j<len(hpf):
            hrPoint+=hpf[j]*float(filter_taps[j])
            j+=1
        hrPoint = math.pow(hrPoint,2)
        hpf.pop(0)
        hpf.append(0)
    return hrPoint

heartRate=[]
time10s=5000
beat=0
timer = 0

def ecgSensor(x):
    global ct, initialTime, endTime, dataEcgList, timeDuration, currentMode, previousSequenceNumber, timeQueue, previousTimeStamp, dataHrList, dataHomeList
    global timer,beat,time10s, threshold

    d = base64.b64decode(x['data']) #x['data'].decode('base64')
    data=bytearray(d)


    currentTimeStamp = timeQueue.popleft()

    if previousTimeStamp != None: 
        if (previousTimeStamp - currentTimeStamp) >= 1000:
            ct+=(previousTimeStamp - currentTimeStamp)

    previousTimeStamp = currentTimeStamp

    sequenceNumber = data[0]
    # if sequenceNumber == 0 or sequenceNumber == 255:
    #     seqNum.write(str(sequenceNumber) + "," + str(currentTimeStamp) + "\n")

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

    
    ecg2Sample = filterECG(ecg2Sample/10000000)
    res2Sample = filterRes(res2Sample/10000000)

    if ct>=time10s:
        time10s+=5000
        new_data4 = dict(x=[ct],y=[beat*6])
        source4.stream(new_data4,1000)
        if beat*6<threshold:
            database.child("vitalSign/notify").set(True)
            database.child("vitalSign/heartRate").set(beat*6)
        else:
            database.child("vitalSign/notify").set(False)
            database.child("vitalSign/heartRate").set(beat*6)       
        beat=0

    if ecg2Sample>1 and ct-timer>100:
        beat+=1
        timer=ct

    # new_data0 = dict(x=[ct],y=[ecg1Sample])
    # source0.stream(new_data0,1000)

    new_data1 = dict(x=[ct],y=[ecg2Sample])
    source1.stream(new_data1,1000)
    
    # new_data2 = dict(x=[ct],y=[res1Sample])
    # source2.stream(new_data2,1000)

    new_data3 = dict(x=[ct],y=[res2Sample])
    source3.stream(new_data3,1000)

    if flag==0:
        if initialTime ==0:
            currentMode=1
            initialTime=int(time.time())
            endTime = initialTime + (5*60) 
        else:
            dataEcgList.append(str(ecg1Sample1) + "," + str(ecg1Sample2) + "," + str(ecg2Sample1) + "," + str(ecg2Sample2) + "," + str(ResRate1Sample1) + "," + str(ResRate1Sample2) + "," + str(ResRate2Sample1) + "," + str(ResRate2Sample2) + "," + str(ct) + "," + str(int(time.time()*1000)) + "," + str(currentTimeStamp))
            # if int(time.time())>endTime:
            #     endProcess("ecg1Output_" + str(time.time()) + ".csv", dataEcgList,4)

requests = zmq.Context().socket(zmq.PULL)
requests.bind('tcp://137.132.165.139:5566')

def main():
    global flag, done, ctHR, currentCharac, currentUUID
    print(len(dataQueue))
    while len(dataQueue) > 0:
        # ct+=4
        ctHR+=1000
        x = dataQueue.popleft()
        # d = x['uuid']
        e = x['characteristic']
        # print (e)
        # if d==currentUUID:
            # if e==currentCharac:
        if e=="fff4":
            ecgSensor(x)
        else:
            print("Service not supported")
            # else:
            #     print("Characteristic not found")


def dataReceive():
    global dataQueue
    global currentCharac, currentUUID, currentMode, dataEcgList, dataHrList, dataHomeList, endTime, currentMode, timeQueue, button

    while True:
        x = requests.recv_json()
        if x['uuid'] == currentUUID and x['characteristic']==currentCharac:
            dataQueue.append(x)
            timeQueue.append(int(time.time()*1000))
        elif currentMode!=0:
            dataQueue.append(x)
        if int(time.time())>endTime:
            if currentMode!=0:
                endProcess()
            

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

# t2 = threading.Thread(target=writeToFiles)
# t2.setDaemon(True)
# t2.start()

curdoc().add_root(column(row(ticker1, ticker2, duration, button),row(fig1, fig3), fig4))#row(fig, figH)))
curdoc().add_periodic_callback(main,50)


                    
