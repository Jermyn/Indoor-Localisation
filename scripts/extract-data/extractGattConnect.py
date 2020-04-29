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
              {"type": {"value": "anchor-status"}},
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
    try:
      strWrite = str(doc['_source']['@timestamp'] + "," + str(doc['_source']['anchorId']) + "," + str(doc['_source']['gatts']['connected']) + "\n")
      file.write(strWrite)
    except:
      pass

res = searchDoc(es_conn, sys.argv[1], sys.argv[2], sys.argv[3])
print("%d documents found" % res['hits']['total'])
writeToFile(sys.argv[4], res)
# for doc in res['hits']['hits']:
#   try:
#     print("%s %s %s" % (doc['_source']['@timestamp'], doc['_source']['anchorId'], doc['_source']['gatts']['connected']))
    # print (doc)
  # except:
  #   pass
  