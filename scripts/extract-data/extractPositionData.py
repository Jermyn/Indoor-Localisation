from elasticsearch import Elasticsearch
import csv
import sys

HOST_URLS = ["http://127.0.0.1:9200"]

es_conn = Elasticsearch(HOST_URLS)

# print ("Cluster Name: ", es_conn.cluster.state(metric=["cluster_name"])['cluster_name'])

# es_conn.indices.put_settings(index="zmq",
#                         body= {"index" : {
#                                 "max_result_window" : 500000
#                               }})

def searchDoc(es_database, startTime, endTime, querySize):
  ##edit the query size
  res = es_database.search(index="zmq", body={"size": querySize,
    "sort": [
      {
        "@timestamp": {
          "order": "asc"
        }
      }
    ], 
     "query": {
          "bool": {
            "filter": [
              {"type": {"value": "position-update"}},
              {
                "range": {
                  "@timestamp": {
                    "gte": startTime,
                    "lte": endTime,
                    "time_zone": "+08:00"
                  }
                }
              }
            ]
          }
        }
      })
  return res

def writeToFile(fileName, result):
  ##change the filename
  file = open("./ExtractedData/" + fileName, 'w')
  for doc in result['hits']['hits']:
    strWrite = str(doc['_source']['id'] + "," + str(doc['_source']['time']) + "," + str(doc['_source']['lng']) + "," + str(doc['_source']['lat']) + "," + str(doc['_source']['map']['scale']) + "\n")
    file.write(strWrite)

###first argument:start time, 2nd argument: end time, 3rd argument: query size, 4th argument: filename
res = searchDoc(es_conn, sys.argv[1], sys.argv[2], sys.argv[3])
print("%d documents found" % res['hits']['total'])
writeToFile(sys.argv[4], res)
# for doc in res['hits']['hits']:
    # print("%s %s %s %s %s" % (doc['_source']['lng'], doc['_source']['lat'], doc['_source']['id'], doc['_source']['time'], doc['_source']['map']['scale']))
    # print (doc['_source']['id'])