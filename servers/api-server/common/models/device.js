// 'use strict';

var axios = require('axios')
var config = require('../../../config')

module.exports = function(Device) {
  Device.logs = (cb) => {
    axios.post(config.elkServer.url + "/position_update/_search/", {
      "size": 0,
      "aggregations":{
        "id":{
          "terms": {
            "field": "id.keyword",
            "size" : 40
          },
          "aggregations":{
            "latest": {
              "top_hits":{
                "size": 1,
                "sort": [{"@timestamp": {"order": "desc"}}],
                "_source": {"includes": ["lat", "lng","map","id","@timestamp"]}
              }
            }
          }
        }
      }
    })
    .then(({data}) => {
      cb(null, data)
    })
    .catch((err) => {
    	// console.log(err)
      cb(err)
    })
  }

  Device.remoteMethod('logs', {
    http:     {path: '/logs', verb: 'get'},
    returns:  {type: 'Object', root: true},
    description: 'get elasticsearch device logs'
  })
  
};
