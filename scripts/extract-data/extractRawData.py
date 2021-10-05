from elasticsearch import Elasticsearch, helpers
import csv
import sys
import requests

HOST_URLS = ["http://52.77.184.100:9200"]

es_conn = Elasticsearch(HOST_URLS)

headers = {
    'Content-Type': 'application/json',
}

doc_length = 0

# print ("Cluster Name: ", es_conn.cluster.state(metric=["cluster_name"])['cluster_name'])

# es_conn.indices.put_settings(index="zmq",
#                         body= {"index" : {
#                                 "max_result_window" : 500000
#                               }})
def searchDoc(es_database, startTime, endTime, querySize):
  ##edit the query size
  temp = []
  allData, fullData = [],[]
  data = '{\
    "size": %d,\
     "sort": [\
       {\
         "@timestamp": {\
          "order": "asc"\
        }\
      }\
    ], \
     "query": {\
                "range": {\
                  "@timestamp": {\
                    "gte": "%s",\
                    "lte": "%s",\
                    "time_zone": "+08:00"\
                  }\
                }\
              }\
      }' % (int(querySize), startTime, endTime)

  response = requests.post('http://52.77.184.100:9200/raw_data/_search/?scroll=3m', headers=headers, data=data)
  resp = response.json()
  temp = resp['hits']['hits']
  allData.append(temp)
  temp = []
  scroll_id = resp['_scroll_id']
  allData = doScroll(es_database, allData, scroll_id)
  for data in allData:
        fullData.append(data)
  return fullData

def doScroll(es_database, fullData, scroll_id):
  data = '{\n    "scroll":"1m",\n    "scroll_id":"%s"\n}' % (scroll_id)
  response = requests.post('http://52.77.184.100:9200/_search/scroll', data=data, headers=headers)
  resp = response.json()
  print ('scroll() query length:', len(resp))
  temp = []
  temp = resp['hits']['hits']
  fullData.append(temp)
  temp = []
  scroll_id = resp['_scroll_id']
  scroll_size = len(resp['hits']['hits'])
  if scroll_size > 0:
    doScroll(es_database, fullData, scroll_id)
  # else:
  #   if (len(fullData) > 0):
  #     print (len(fullData[0]))
      # print (len(fullData[0][0].items()))
  return fullData

def writeToFile(fileName, result):
  file = open("./ExtractedData/" + fileName, 'w')
  file.write("beaconid, anchorId, time, rssi\n")
  for key in result:
    for doc in key:
      if 'anchorId' in doc['_source']:
        strWrite = str(doc['_source']['gattid'] + "," + doc['_source']['anchorId'] + "," + str(doc['_source']['time']) + "," + str(doc['_source']['rssi']) + "\n")
        file.write(strWrite)

###first argument:start time, 2nd argument: end time, 3rd argument: query size, 4th argument: filename
res = searchDoc(es_conn, sys.argv[1], sys.argv[2], sys.argv[3])
# print(res)
for doc in res:
  doc_length += len(doc)
print("%d documents found" % doc_length)
writeToFile(sys.argv[4], res)
# for doc in res['hits']['hits']:
#   print (doc)
#   print("%s %s %s %s" % (doc['_source']['rssi'], doc['_source']['gattid'], doc['_source']['anchorId'], doc['_source']['time']))
  

##change the filename

