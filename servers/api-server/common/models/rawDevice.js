// 'use strict';

// var axios = require('axios')
// var config = require('../../../config')

// module.exports = function(Device) {
//   Device.logs = (cb) => {
//     axios.post(config.elkServer.url + "/zmq/raw-data/_search", {
//       "size": 0,
//       "aggregations":{
//         "id":{
//           "terms": {
//             "field": "transmitterId.keyword",
//             "size" : 10
//           },
//           "aggregations":{
//             "latest": {
//               "top_hits":{
//                 "size": 1,
//                 "sort": [{"@timestamp": {"order": "desc"}}],
//                 "_source": {"includes": ["receiverId","rssi","@timestamp"]}
//               }
//             }
//           }
//         }
//       }
//     })
//     .then(({data}) => {
//       cb(null, data)
//     })
//     .catch((err) => {
//       cb(err)
//     })
//   }

//   Device.remoteMethod('logs', {
//     http:     {path: '/rawlogs', verb: 'get'},
//     returns:  {type: 'Object', root: true},
//     description: 'get elasticsearch device logs'
//   })
  
// };
