// 'use strict';
// var axios = require('axios')
// var config = require('../../../config')

// module.exports = function(Beacon) {
//   Beacon.logs = (cb) => {
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
//                 "sort": [{"@timestamp": {"order": "desc"}}],
//                 "_source": {"includes": ["transmitterId","receiverId","rssi","@timestamp"]}
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

//   Beacon.remoteMethod('logs', {
//     http:     {path: '/logs', verb: 'get'},
//     returns:  {type: 'Object', root: true},
//     description: 'get elasticsearch device logs'
//   })
// };

'use strict';

module.exports = function(Beacon) {

};
