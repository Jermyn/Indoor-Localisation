from bokeh.io import curdoc
from bokeh.models import ColumnDataSource
from bokeh.plotting import Figure

import urllib.request, json 
import numpy as np


source = ColumnDataSource(dict(x=[],y=[]))

fig=Figure()
fig.line(source=source, x='x', y='y', line_width=2, alpha=.85, color='red')

ct=0
def update_data():
	global ct
	ct+=1
	data = json.loads(urllib.request.urlopen("http://137.132.165.139/api/edges").read().decode())
	connection = data['118:10']
	# print(connection['mu'])
	new_data = dict(x=[ct],y=[connection['mu']])
	source.stream(new_data,1000)

curdoc().add_root(fig)
curdoc().add_periodic_callback(update_data,1000)