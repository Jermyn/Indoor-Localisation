# from bokeh.io import curdoc
# from bokeh.models import ColumnDataSource
# from bokeh.plotting import Figure

import urllib.request, json 
import numpy as np
import csv

from bokeh.layouts import gridplot
from bokeh.plotting import figure, show, output_file
from bokeh.models import BoxAnnotation
from bokeh.layouts import row, column

scale=9.81/16200

accX=[]
accY=[]
accZ=[]

magX=[]
magY=[]
magZ=[]

gyroX=[]
gyroY=[]
gyroZ=[]

time=[]
initialTime=0
disconnectTime=[]

def processRaw(rawData):
	global accX, accY, accZ, magX, magY, magZ, gyroX, gyroY, gyroZ, initialTime, time

	if initialTime==0:
		initialTime=rawData[0][9]
	i=0
	while i< len(rawData):
		accX.append(int(rawData[i][0])*scale)
		accY.append(int(rawData[i][1])*scale)
		accZ.append(int(rawData[i][2])*scale)
		magX.append(rawData[i][3])
		magY.append(rawData[i][4])
		magZ.append(rawData[i][5])
		gyroX.append(rawData[i][6])
		gyroY.append(rawData[i][7])
		gyroZ.append(rawData[i][8])
		time.append(int(rawData[i][9])-int(initialTime))
		i+=1
	print("process Done")

def read_file(fileName):
	global accX, accY, accZ, magX, magY, magZ, gyroX, gyroY, gyroZ, time
	accX=[]
	accY=[]
	accZ=[]

	magX=[]
	magY=[]
	magZ=[]

	gyroX=[]
	gyroY=[]
	gyroZ=[]

	time=[]
	with open(fileName, 'r') as f:
		next(f)
		reader = csv.reader(f)
		rawData_list = list(reader)
	print("Read Done")
	processRaw(rawData_list)
	
def processData(limit):
	global disconnectTime
	disTime=[]
	i=1
	while i< len(time):
		if int(time[i])-int(time[i-1])>limit:
			# print(int(time[i])-int(time[i-1]))
			disTime.append(time[i-1])
			disTime.append(time[i])
			disconnectTime.append(disTime)
			disTime=[]
		i+=1


read_file('homeOutputwitoutdisconnect.csv')
processData(40)

p1 = figure(plot_width=1000, title="HomeSensor")
p1.grid.grid_line_alpha=0.3
p1.xaxis.axis_label = 'Time'
p1.yaxis.axis_label = 'Data'

p1.line(time, accX, line_width=2, alpha=.85, color='red')
k=0
while k<len(disconnectTime):
	p1.line(disconnectTime[k], -9.4, line_width=2, alpha=.85, color='blue')
	k+=1

# p1.line(actual_time, actual_accX, line_width=2, alpha=.85, color='blue')
# p1.add_layout(BoxAnnotation(left=time[len(time)-1], fill_alpha=0.1, fill_color='red'))
# p.add_layout(BoxAnnotation(bottom=80, top=180, fill_alpha=0.1, line_color='olive', fill_color='olive'))
# p.add_layout(BoxAnnotation(bottom=180, fill_alpha=0.1, fill_color='red'))

output_file("staticGraph.html")
show(p1)