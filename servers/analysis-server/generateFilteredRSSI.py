#### different filters

import csv
import math
import operator
import json
from datetime import datetime, timedelta
import math
from statistics import mean, pstdev, quantiles
import pdb
import pandas as pd
import sys
# from cache import getCache

# sysStartTime=datetime.strptime("2017-08-10 14.56.56.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#MD6
# sysEndTime=datetime.strptime("2017-08-10 15.15.25.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2018-07-13 13.35.00.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#MD6
# sysEndTime=datetime.strptime("2018-07-13 14.35.00.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2018-10-22 13.37.41.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#W52
# sysEndTime=datetime.strptime("2018-10-22 13.54.53.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2019-01-17 18.55.20.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Mini_Actlab
# sysEndTime=datetime.strptime("2019-01-17 19.00.35.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2019-01-21 17.28.10.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Mini_Actlab2
# sysEndTime=datetime.strptime("2019-01-21 17.30.45.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2019-01-22 08.47.00.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Mini_Actlab3
# sysEndTime=datetime.strptime("2019-01-22 08.51.00.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2019-02-08 16.50.20.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Mini_Actlab4
# sysEndTime=datetime.strptime("2019-02-08 16.53.45.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2019-02-08 13.24.35.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Mini_Actlab4_calibrate
# sysEndTime=datetime.strptime("2019-02-08 16.37.25.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2019-05-30 11.09.35.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Experiment5
# sysEndTime=datetime.strptime("2019-05-30 11.16.01.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2020-03-17 11.16.29.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Experiment3_HJ
# sysEndTime=datetime.strptime("2020-03-17 11.25.07.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2020-03-20 13.13.42.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#Experiment1_Jermyn
# sysEndTime=datetime.strptime("2020-03-20 13.20.27.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2021-06-17 15.45.00.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#AWS_Test1
# sysEndTime=datetime.strptime("2021-06-17 15.48.00.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2021-07-07 11.31.15.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#fake_test1
# sysEndTime=datetime.strptime("2021-07-07 11.34.45.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2021-07-08 17.41.30.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#actlab_test1
# sysEndTime=datetime.strptime("2021-07-08 17.48.05.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2021-09-28 19.17.40.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#actlab_test2
# sysEndTime=datetime.strptime("2021-09-28 19.22.45.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# sysStartTime=datetime.strptime("2021-10-05 16.22.00.00", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000#actlab_test1
# sysEndTime=datetime.strptime("2021-10-05 16.23.00.00" , "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

sysStartTime = datetime.strptime("2021-10-06 17.39.01.028", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000  # Experiment4
sysEndTime = datetime.strptime("2021-10-06 17.50.59.685", "%Y-%m-%d %H.%M.%S.%f").timestamp()*1000

# rawFile = open('rawRssi.csv', 'w')

result=[]
totalAvg = []

anchorID=[]
rawRSSIData=[]

####################################################################################
## State
####################################################################################
# cache         = getCache()

def processRaw(rawData):
	global sysStartTime, sysEndTime
	global anchorID, rawRSSIData, cache

	rawData = sorted(rawData, key=operator.itemgetter(2), reverse=False)

	i=0
	while i< len(rawData):
		# rawData[i][2] = (datetime.strptime(rawData[i][2], "%Y-%m-%dT%H:%M:%S.%fZ")+timedelta(hours=8)).timestamp()*1000
		if int(rawData[i][2]) >= int(sysStartTime) and int(rawData[i][2])<=int(sysEndTime):
			# if rawData[i][0] == 'b2':
				# if rawData[i][1] != 'C3':
				# rawData[i][2] = datetime.fromtimestamp(int(rawData[i][2])/1000).strftime("%Y-%m-%d %H:%M:%S.%f")
				# rawFile.write(str(rawData[i][0]) + "," + str(rawData[i][1]) + "," + str(rawData[i][2]) + "," + str(rawData[i][3]) + "\n")
				# 	print (datetime.fromtimestamp(int(rawData[i][2])/1000).strftime("%Y-%m-%d %H:%M:%S"), rawData[i][1], rawData[i][3])
			if rawData[i][1] not in anchorID:
				anchorID.append(rawData[i][1])
				temp=[]
				tempA=[rawData[i][3]]
				tempB=[rawData[i][2]]
				temp.append(rawData[i][1])
				temp.append(tempA)
				temp.append(tempB)
				rawRSSIData.append(temp)
			else:
				j=0
				while j<len(rawRSSIData):
					if rawRSSIData[j][0] == rawData[i][1]:
						rawRSSIData[j][1].append(rawData[i][3]) #rssi
						rawRSSIData[j][2].append(rawData[i][2]) #timestamp
						break
					j+=1
		i+=1
	print("process Done")

def offsetRaw(b1_rssi, offset):
	k=0
	while k<len(b1_rssi):
		b1_rssi[k] = float(b1_rssi[k]) + offset
		k+=1
	return b1_rssi

def filterRSSI(rssiList, alpha):
	filteredData=[]

	mu = int(rssiList[1][0])
	time = int(rssiList[2][0])
	alp=alpha
	sigma=1000
	period=500
	lastUpdate=time
	muList=[]
	sigmaList=[]
	timeList=[]
	periodList=[]
	j=0
	while j< len(rssiList[1]):
		diff= int(rssiList[1][j]) - mu
		incr = alp * diff 
		print(type(mu), type(incr))
		mu += incr
		sigma = (1-alp) * (sigma+(diff *incr))
		
		diff = int(rssiList[2][j]) - lastUpdate - period
		incr = 0.01*diff

		period += incr
		lastUpdate = int(rssiList[2][j])
		# if rssiList[0]=='A2':
		# 	pdb.set_trace()

		if period >500:
			alp=alpha #calm the filter down
		else:
			alp = (period*0.0001667) + 0.0333 #filter aggresively
		
		muList.append(mu)
		sigmaList.append(sigma)
		timeList.append(lastUpdate)
		periodList.append(period)
		j+=1
	
	filteredData.append(muList)
	filteredData.append(sigmaList)
	filteredData.append(timeList)
	filteredData.append(periodList)
	# pdb.set_trace()
	return filteredData

def Averaging(selectedList, anchor):
	avgList = []
	sigmaList = []
	periodList = []
	totalAvg = []
	# print (selectedList[3][0])
	avgList.append(float(selectedList[0][0]))
	sigmaList.append(float(selectedList[1][0]))
	periodList.append(float(selectedList[3][0]))
	initialTime = int(int(selectedList[2][0])/1000)
	nextTime = int(int(selectedList[2][1])/1000)
	index = 1
	nextIndex = 0
	end = 0
	while nextIndex+index<=len(selectedList[0])-1:
		while initialTime == nextTime:
			avgList.append(float(selectedList[0][nextIndex+index]))
			sigmaList.append(float(selectedList[1][nextIndex+index]))
			periodList.append(float(selectedList[3][nextIndex+index]))
			if (nextIndex+index)<len(selectedList[0])-1:
				index += 1
				nextTime = int(int(selectedList[2][nextIndex+index])/1000)
			else:
				end = 1
				break

		avg_rssi = mean(avgList)
		avg_sigma = mean(sigmaList)
		avg_period = mean(periodList)
		strAvg = str(avg_rssi) + ", " + str(avg_sigma) + ", " + str(initialTime) + ", " + str(avg_period)
		totalAvg.append(strAvg.split(", "))
		nextIndex += index
		index = 0
		if nextIndex==len(selectedList[0])-1:
			# print (nextIndex, anchor, selectedList[0][nextIndex])
			if end == 0:
				initialTime = int(int(selectedList[2][nextIndex])/1000)
				avgList = []
				periodList = []
				sigmaList = []
				avgList.append(float(selectedList[0][nextIndex]))
				sigmaList.append(float(selectedList[1][nextIndex]))
				periodList.append(float(selectedList[3][nextIndex]))
				avg_rssi = mean(avgList)
				avg_sigma = mean(sigmaList)
				avg_period = mean(periodList)
				strAvg = str(avg_rssi) + ", " + str(avg_sigma) + ", " + str(initialTime) + ", " + str(avg_period)
				totalAvg.append(strAvg.split(", "))
			break
		initialTime = int(int(selectedList[2][nextIndex])/1000)
		nextTime = int(int(selectedList[2][nextIndex+1])/1000)
		avgList = []
		sigmaList = []
		periodList = []
		avgList.append(float(selectedList[0][nextIndex]))
		sigmaList.append(float(selectedList[1][nextIndex]))
		periodList.append(float(selectedList[3][nextIndex]))
		index = 1
	# if anchor=='E8':
		# print (len(totalAvg))
		# print (totalAvg[1][0])
	return totalAvg

def generateDataFrame(dataList, anchor):
	timeInterval = []
	rssilist = []
	sigmalist = []
	periodlist = []
	devicelist = []
	for i in dataList:
		rssilist.append(float(i[0]))
		sigmalist.append(float(i[1]))
		# timeInterval.append(int(i[2]))
		timeInterval.append(datetime.fromtimestamp(int(i[2])).strftime("%Y-%m-%d %H:%M:%S"))
		periodlist.append(float(i[3]))
		devicelist.append(anchor)
	anchorData = pd.DataFrame({'timestamp': timeInterval, 'anchor': devicelist, 'mu': rssilist, 'sigma': sigmalist, 'period': periodlist})
	anchorData.set_index('timestamp', inplace=True)
	anchorData.index = pd.to_datetime(anchorData.index)
	anchorData = anchorData.resample('S')['mu', 'sigma', 'period'].mean().ffill()
	df = anchorData.rolling(5).mean()
	timestamp = df.loc[:,:].index.tolist()
	mu = df.loc[:, 'mu'].tolist()
	sigma = df.loc[:, 'sigma'].tolist()
	period = df.loc[:, 'period'].tolist()
	# for j in timestamp:
		# if anchor=='E8':
		# j = datetime.strptime(str(j), "%Y-%m-%d %H:%M:%S:%f").timestamp()
	# if anchor=='E8':
	# 	print (timestamp)
	# 	print (df.head)
	# 	print (mu[4], sigma[4], period[4])
	return [timestamp, mu, sigma, period]

def findAndRemoveOutliers(rssiData):
	anchor, rssi, distance = [], [], []
	anchorDataDict = {}
	for index, beaconData in enumerate(rssiData[1]):
		rssiData[1][index] = int(beaconData)
		# anchor.append(anchorData[0])
		rssi.append(int(beaconData))
	Q1 = quantiles(rssi, n=4)[0]
	Q3 = quantiles(rssi, n=4)[2]
	IQR = Q3 - Q1
	for keyIndex, value in enumerate(rssi):
		if value < (Q1 - 1.7 * IQR) or value > (Q3 + 1.7 * IQR):
			del rssiData[1][rssiData[1].index(value)] ##remove the outlier rssi
			del rssiData[2][keyIndex] ##remove the timestamp correspond to the outlier rssi
	return rssiData

def generateFilterRSSI(beaconRSSIList):
	global result, cache

	result.append('anchorID,mu,sigma,timestamp,period')

	i=0
	k=0
	print (beaconRSSIList)
	while i< len(beaconRSSIList):
		# while k< len(cache['anchors']):
		# 	if cache['anchors'][k]['device']['location']['map']['id'] == 'actlab':
		# 		if(cache['anchors'][k]['id']==beaconRSSIList[i][0]):
		# 			offset = cache['anchors'][k]['device']['offset']
		# 			beaconRSSIList[i][1] = offsetRaw(beaconRSSIList[i][1], offset)
		# 	k+=1
		# beaconRSSIList[i] = findAndRemoveOutliers(beaconRSSIList[i])
		filterRssi = filterRSSI(beaconRSSIList[i], float(sys.argv[2]))
		# if beaconRSSIList[i][0] == 'A2':
		# 	pdb.set_trace()
		# filterRssiData = Averaging(filterRssi, beaconRSSIList[i][0])
		# AverageRssiData = generateDataFrame(filterRssiData, beaconRSSIList[i][0])
		# if beaconRSSIList[i][0]=='E8':
		# 	print (AverageRssiData[2][1])
		j=0
		while j<len(filterRssi[0]):
		# while j<len(AverageRssiData[0]):
			# print (j, beaconRSSIList[i][0], filterRssiData[j][0], filterRssiData[j][1], filterRssiData[j][2], filterRssiData[j][3])
			# filterRssiData[2][j] = datetime.fromtimestamp(int(float(filterRssiData[2][j])/1000)).strftime("%Y-%m-%d %H:%M:%S")
			result.append(str(beaconRSSIList[i][0]) + ',' + str(filterRssi[0][j]) + ',' + str(filterRssi[1][j]) + ',' + str(filterRssi[2][j])+','+str(filterRssi[3][j]))
			# result.append(str(beaconRSSIList[i][0]) + ',' + str(filterRssiData[j][0]) + ',' + str(filterRssiData[j][1]) + ',' + str(filterRssiData[j][2])+','+str(filterRssiData[j][3]))
			# result.append(str(beaconRSSIList[i][0]) + ',' + str(AverageRssiData[1][j]) + ',' + str(AverageRssiData[2][j]) + ',' + str(AverageRssiData[0][j])+','+str(AverageRssiData[3][j]))
			j+=1
		i+=1
		# filterRssiData = []
	print("Generated Filtered rssi!!")


def writeToFile(rawData):
	data = rawData

	write_file = str("./" + sys.argv[1] + "/actlab_RSSI_Test3_06Oct.csv")
	with open(write_file, "w") as output:
		for line in data:
			output.write(line + '\n')

	print("Write to file Done!")



def read_file(fileName):
	with open(fileName, 'r') as f:
		next(f)
		reader = csv.reader(f)
		rawData_list = list(reader)
	print("Read RSSI Done")
	processRaw(rawData_list)


read_file('./raw-data/actlab_loc_06Oct.csv')
generateFilterRSSI(rawRSSIData)
writeToFile(result)
