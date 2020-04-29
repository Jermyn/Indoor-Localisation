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

ecg1=[]
ecg2=[]
res1=[]
res2=[]
time=[]
disconnectTime=[]
initialTime =0

def processRaw(rawData):
	global ecg1, ecg2, res1, res2, time, initialTime
	
	if initialTime==0:
		initialTime=rawData[0][2]
	i=0
	while i< len(rawData):
		ecg1.append(int(rawData[i][0]))
		ecg1.append(int(rawData[i][1]))
		ecg2.append(int(rawData[i][2]))
		ecg2.append(int(rawData[i][3]))
		res1.append(int(rawData[i][4]))
		res1.append(int(rawData[i][5]))
		res2.append(int(rawData[i][6]))
		res2.append(int(rawData[i][7]))
		time.append(int(rawData[i][8])-int(initialTime)) #8
		i+=1
	print("process raw Done")

def read_file(fileName):
	global ecg1, ecg2, res1, res2, time
	ecg1=[]
	ecg2=[]
	res1=[]
	res2=[]
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
			print(int(time[i])-int(time[i-1]))
			disTime.append(time[i-1])
			disTime.append(time[i])
			disconnectTime.append(disTime)
			disTime=[]
		i+=1
	print("Processed Data")


read_file('ecg1Output_1497862102.011433.csv')
processData(20)

p1 = figure(plot_width=700, plot_height=400, title="ECG1 Data")
p1.grid.grid_line_alpha=0.3
p1.xaxis.axis_label = 'Time'
p1.yaxis.axis_label = 'Data'

p1.line(time, ecg1, line_width=2, alpha=.85, color='red')

p1.ygrid.minor_grid_line_color = 'navy'
p1.ygrid.minor_grid_line_alpha = 0.1

p1.xgrid.minor_grid_line_color = 'navy'
p1.xgrid.minor_grid_line_alpha = 0.1

k=0
while k<len(disconnectTime):
	p1.line(disconnectTime[k], -9.4, line_width=2, alpha=.85, color='blue')
	k+=1


p2 = figure(plot_width=700, plot_height=400, title="ECG2 Data")
p2.grid.grid_line_alpha=0.3
p2.xaxis.axis_label = 'Time'
p2.yaxis.axis_label = 'Data'

p2.line(time, ecg2, line_width=2, alpha=.85, color='red')

p2.ygrid.minor_grid_line_color = 'navy'
p2.ygrid.minor_grid_line_alpha = 0.1

p2.xgrid.minor_grid_line_color = 'navy'
p2.xgrid.minor_grid_line_alpha = 0.1

k=0
while k<len(disconnectTime):
	p2.line(disconnectTime[k], -9.4, line_width=2, alpha=.85, color='blue')
	k+=1


p3 = figure(plot_width=700, plot_height=400, title="RES1 Data")
p3.grid.grid_line_alpha=0.3
p3.xaxis.axis_label = 'Time'
p3.yaxis.axis_label = 'Data'

p3.line(time, res1, line_width=2, alpha=.85, color='green')

p3.ygrid.minor_grid_line_color = 'navy'
p3.ygrid.minor_grid_line_alpha = 0.1

p3.xgrid.minor_grid_line_color = 'navy'
p3.xgrid.minor_grid_line_alpha = 0.1

k=0
while k<len(disconnectTime):
	p3.line(disconnectTime[k], -9.4, line_width=2, alpha=.85, color='blue')
	k+=1


p4 = figure(plot_width=700, plot_height=400, title="RES2 Data")
p4.grid.grid_line_alpha=0.3
p4.xaxis.axis_label = 'Time'
p4.yaxis.axis_label = 'Data'

p4.line(time, res2, line_width=2, alpha=.85, color='green')

p4.ygrid.minor_grid_line_color = 'navy'
p4.ygrid.minor_grid_line_alpha = 0.1

p4.xgrid.minor_grid_line_color = 'navy'
p4.xgrid.minor_grid_line_alpha = 0.1

k=0
while k<len(disconnectTime):
	p4.line(disconnectTime[k], -9.4, line_width=2, alpha=.85, color='blue')
	k+=1

output_file("ecgstaticGraph.html")
# show(column(row(p1)))
show(column(row(p1,p2),row(p3,p4)))