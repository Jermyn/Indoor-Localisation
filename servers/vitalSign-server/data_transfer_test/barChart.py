from bokeh.io import curdoc
from bokeh.models import ColumnDataSource
from bokeh.charts import Bar
from bokeh.layouts import row, column
from bokeh.models.widgets import PreText, Select
from bokeh.plotting import figure

import urllib.request, json 
import numpy as np

titleLine2="Connection"
titleLine1="Sigma"
titleLine="Mean"
receiverNo='1'

mu=[]
adj_mu=[]
sigma=[]
adj_sig=[]

graph=[]

receivers = []
devices=[]
flag=0

# data = {
#     'sample': ['1st', '2nd', '1st', '2nd', '1st', '2nd'],
#     'interpreter': ['python', 'python', 'pypy', 'pypy', 'jython', 'jython'],
#     'timing': [-2, 5, 12, 40, 22, 30]
# }

# set up widgets

source = ColumnDataSource(dict(x=[],y=[], height=[]))
source1 = ColumnDataSource(dict(x=[],y=[], height=[]))
source2 = ColumnDataSource(dict(x=[],y=[]))

data = json.loads(urllib.request.urlopen("http://137.132.165.139/api/edges").read().decode())
for connection in data:
	transmit = data[connection]['transmitterId']
	receive = data[connection]['receiverId']
	if len(receivers)==0:
		receivers.append(receive)
	else:
		k=0
		while k< len(receivers):
			if receivers[k]==receive:
				flag+=1
				break;
			k+=1
		if flag==0:
			receivers.append(receive)
		flag=0
	if(receive==receiverNo):
		devices.append(transmit)
		mu.append(data[connection]['mu'])
		adj_mu.append(float(data[connection]['mu'])/2)
		sigma.append(data[connection]['mu'])
		adj_sig.append(float(data[connection]['sigma'])/2)

stats = PreText(text='', width=500)
ticker1 = Select(value='1', options=receivers, title="Receiver")
ticker2 = Select(value='100', options=devices, title="Transmitter")

# print(receivers)
# i=0
# while i< len(devices) -20:
# 	sources.append(ColumnDataSource(dict(x=[],y=[])))
# 	fig=figure(plot_width=900, plot_height=200, title=devices[i])
# 	fig.line(source=sources[i], x='x', y='y', line_width=2, alpha=.85, color='red')
# 	graph.append(fig)
# 	i+=1



fig=figure(plot_width=600, plot_height=400, y_range=[-50,-100],  title=titleLine)
fig.rect(source=source, x='x', y='y', width=0.4, height='height', color='blue')

fig1=figure(plot_width=600, plot_height=400, y_range=[0,150], title=titleLine1)
fig1.rect(source=source1, x='x',  y='y', width=0.4, height='height', color='red')

fig2=figure(plot_width=900, plot_height=250, title=titleLine2)
fig2.line(source=source2, x='x', y='y', line_width=2, alpha=.85, color='red')

ct=0


firstRow = row(ticker1)
secondRow = row(fig, fig1)
layout = column(firstRow, secondRow, ticker2, fig2)

# def update_data():
# 	global ct
# 	ct+=1
# 	data = json.loads(urllib.request.urlopen("http://137.132.165.139/api/edges").read().decode())
# 	connection = data['112:12']
# 	# print(connection['mu'])
# 	new_data = dict(x=[ct],y=[connection['mu']])
# 	source.stream(new_data,1000)

def update_data():
	global ct
	ct+=1
	receiverNo=ticker1.value
	data = json.loads(urllib.request.urlopen("http://137.132.165.139/api/edges").read().decode())
	result = data[str(ticker2.value + ':' + ticker1.value)]
	for connection in data:
		transmit = data[connection]['transmitterId']
		receive = data[connection]['receiverId']
		if(receive==receiverNo):
			i=0
			while i< len(devices):
				if transmit==devices[i]:
					mu[i] = data[connection]['mu']
					adj_mu[i]=(float(data[connection]['mu'])/2)
					sigma[i]=data[connection]['sigma']
					adj_sig[i]=(float(data[connection]['sigma'])/2)
					# print(receiverNo)
					break;
				i+=1

	# source.data = ColumnDataSource(dict(x=devices,y=adj_mu, height=mu))
	# source1 = ColumnDataSource(dict(x=[],y=[], height=[)
	# source2 = ColumnDataSource(dict(x=[],y=[]))
	
	new_data = dict(x=devices,y=adj_mu,height=mu)
	new_data1 = dict(x=devices,y=adj_sig, height=sigma)
	new_data2 = dict(x=[ct],y=[result['mu']])
	
	source.stream(new_data,100)
	source1.stream(new_data1,100)
	source2.stream(new_data2,100)

	# print(str(ticker2.value + ':' + ticker1.value))

	# for connection in data:
	# 	transmit = data[connection]['transmitterId']
	# 	receive = data[connection]['receiverId']
	# 	j=0
	# 	while j<len(devices)-20:
	# 		if transmit == devices[j]:
	# 			print(transmit)
	# 			new_data = dict(x=[ct],y=data[connection]['mu'])
	# 			sources[j].stream(new_data,1000)
	# 			break;
	# 		j+=1	

curdoc().add_root(layout)
curdoc().add_periodic_callback(update_data,1000)



# # best support is with data in a format that is table-like
