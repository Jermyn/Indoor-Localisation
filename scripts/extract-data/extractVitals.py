from elasticsearch import Elasticsearch
import csv
import sys

HOST_URLS = ["http://52.77.184.100:9200"]

es_conn = Elasticsearch(HOST_URLS)

# print ("Cluster Name: ", es_conn.cluster.state(metric=["cluster_name"])['cluster_name'])

# es_conn.indices.put_settings(index="zmq",
#                         body= {"index" : {
#                                 "max_result_window" : 500000
#                               }})
def searchDoc(es_database, startTime, endTime, querySize):
  ##edit the query size
  res = es_database.search(index="vitals", body={"size": querySize,
    "sort": [
      {
        "@timestamp": {
          "order": "asc"
        }
      }
    ], 
     "query": {
                "range": {
                  "@timestamp": {
                    "gte": startTime,
                    "lte": endTime,
                    "time_zone": "+08:00"
                  }
                }
          }
      })
  return res

def writeToFile(fileName, result):
  file = open("./ExtractedData/" + fileName, 'w')
  for doc in result['hits']['hits']:
    if ('rssi' not in doc['_source']):
      strWrite = str(doc['_source']['gattid'] + "," + doc['_source']['anchorId'] + "," + str(doc['_source']['@timestamp']) + "," + str(doc['_source']['data']) + " vitals\n")
    else:
      strWrite = str(doc['_source']['gattid'] + "," + doc['_source']['anchorId'] + "," + str(doc['_source']['@timestamp']) + "," + str(doc['_source']['rssi']) + " rssi\n")
    file.write(strWrite)

###first argument:start time, 2nd argument: end time, 3rd argument: query size, 4th argument: filename
res = searchDoc(es_conn, sys.argv[1], sys.argv[2], sys.argv[3])
# print("%d documents found" % res['hits']['total']['value'])
writeToFile(sys.argv[4], res)
# for doc in res['hits']['hits']:
  # print (doc)
  # print("%s %s %s %s" % (doc['_source']['rssi'], doc['_source']['transmitterId'], doc['_source']['receiverId'], doc['_source']['time']))
  

##change the filename

