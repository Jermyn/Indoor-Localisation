zmq = require('zeromq');
axios = require('axios');
moment = require('moment');
_ = require('underscore');
Promise = require('bluebird');
Rx = require('rxjs/Rx');
config = require('../config');
RRBroker = require('./proxy_req_rep/Broker.js');
Responder = require('./proxy_req_rep/Responder.js');
pg = require('pg');

//#######################################################################
//# ZMQ SOCKETS
//#######################################################################
notify = zmq.socket('pub').connect(config.zmqSockets.broker.xsub);
notifications = zmq.socket('sub').connect(config.zmqSockets.broker.xpub).subscribe(config.notifications.anchorStatus).subscribe(config.notifications.databaseUpdate);

//#######################################################################
//# State
//#######################################################################
cache = {};
dataList = {};
anchorIndex = 0;
cacheVersion = 0;

//#######################################################################
//# UTILITIES
//#######################################################################
stringifyJSON = function(obj) {
  var e;
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    e = error;
    return null;
  }
};

parseJSON = function(obj) {
  var e;
  try {
    return JSON.parse(obj);
  } catch (error) {
    e = error;
    return null;
  }
};

connectServer = function() {
  var pool;
  pool = new pg.Pool({
    user: 'macpro',
    host: '127.0.0.1',
    database: 'indoor-localization-2.0',
    // password: 123,
    port: 5432
  });
  return pool;
};

request = function({query, variables}) {
  return axios({
    method: 'post',
    url: config.apiServer.graphql.url,
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({query, variables})
  });
};

getCache = function() {
  return request({
    variables: null,
    query: 'query { devices{ id type location anchor { id sensitivity measuredPower offset } beacon { id measuredPower } gatt { id connect profile } } anchors { id sensitivity measuredPower offset device { id type location } } beacons { id measuredPower device { id type location } } gatts { id connect profile device { id type location } } maps { id scale coordinates imageURL navMesh } }'
  }).then(function({data}) {
    cache = _.mapObject(data.data, function(val, key) {
      return _.indexBy(val, 'id');
    });
    cache.version = cacheVersion;
    console.log("loaded cache version", cache.version);
    return console.log(stringifyJSON(cache));
  });
};

notifyCacheUpdate = function(version) {
  return getCache().then(function() {
    return notify.send([
      config.notifications.cacheUpdate,
      stringifyJSON({
        version: cacheVersion
      })
    ]);
  });
};

inputBeacon = function(pool, id, deviceid, measuredpower) {
  pool.query(`INSERT INTO beacon(id, measuredpower, deviceid) VALUES('${id}', '${measuredpower}', '${deviceid}')`, (err, res) => {
    if (err === void 0) {
      return console.log("Successfully Inserted");
    } else {
      return console.log(err);
    }
  });
  pool.query(`INSERT INTO device(id, type, location) VALUES('${deviceid}', 'mobile', '[]')`, (err, res) => {
    if (err === void 0) {
      return console.log("Successfully Inserted");
    } else {
      return console.log(err);
    }
  });
  return pool.end();
};

findBeaconByDevice = function(pool, type) {
  var deviceType, index;
  deviceType = [];
  index = 0;
  return new Promise(function(resolve, reject) {
    return pool.query("SELECT deviceid FROM gatt", (err, res) => {
      if (err) {
        console.log("Error finding Beacon");
        return reject(0);
      } else {
        while (index < res.rows.length) {
          if (res.rows[index].deviceid.indexOf(type) !== -1) {
            deviceType.push(parseInt(res.rows[index].deviceid.match(/\d+/)[0]));
          }
          index = index + 1;
        }
        return resolve(deviceType);
      }
    });
  });
};

inputGatt = function(pool, id, profile, deviceid, measuredpower) {
  var characteristics;
  if (profile === "imu") {
    characteristics = '{"fff0": {"fff1": {"notify": true}}}';
  } else if (profile === "ecg") {
    characteristics = '{ "fff0": { "fff4": {"notify": true}, "fff3": { "write": { "data": [6], "timer": [100] } } } }';
  } else if (profile === "hr") {
    characteristics = '{"180d": {"2a37": {"notify": true}}}';
  }
  pool.query(`INSERT INTO gatt(id, profile, connect, deviceid) VALUES('${id}', '${characteristics}', false, '${deviceid}')`, (err, res) => {
    if (err === void 0) {
      return console.log("Successfully Inserted");
    } else {
      return console.log(err);
    }
  });
  pool.query(`INSERT INTO device(id, type, location) VALUES('${deviceid}', 'mobile', '[]')`, (err, res) => {
    if (err === void 0) {
      return console.log("Successfully Inserted");
    } else {
      return console.log(err);
    }
  });
  return pool.query(`INSERT INTO beacon(id, measuredpower, deviceid) VALUES('${id}', '${measuredpower}', '${deviceid}')`, (err, res) => {
    if (err === void 0) {
      return console.log("Successfully Inserted");
    } else {
      return console.log(err);
    }
  });
};

// pool.end()
deleteGatt = function(pool, id) {
  pool.query(`DELETE FROM gatt WHERE id='${id}'`, (err) => {
    if (err === void 0) {
      return console.log("Successfully deleted");
    } else {
      return console.log(err);
    }
  });
  return pool.end();
};

findBeacon = function(pool, id) {
  return new Promise(function(resolve, reject) {
    return pool.query(`SELECT id FROM beacon WHERE id='${id}'`, (err, res) => {
      var ref;
      if (err) {
        console.log("Error finding Beacon");
        return reject(0);
      } else {
        // console.log res
        if (((ref = res.rows[0]) != null ? ref.id : void 0) === id) {
          console.log(`Found Beacon ${id}`);
          return resolve(res.rows[0].id === id);
        } else {
          console.log(`Beacon ${id} doesn't exist`);
          return resolve(false);
        }
      }
    });
  });
};

determineMeasuredPower = function(anchorId) {
  var key, ref, val;
  ref = cache.anchors;
  for (key in ref) {
    val = ref[key];
    if (val.id === anchorId) {
      return val.measuredPower;
    }
  }
};

findDistance = function(rssi, measuredPower) {
  return 10 ** ((rssi - measuredPower) / -20);
};

findConnectingAnchors = function(minDistance) {
  var key, val, withinRangeList;
  withinRangeList = [];
  for (key in dataList) {
    val = dataList[key];
    if (val < minDistance) {
      console.log(key, val);
      withinRangeList.push({
        [`${key}`]: val
      });
    }
  }
  return withinRangeList.length;
};

// compare_to_sort = (x,y) -> 
//  {
//   if (x.title < y.title)
//     return -1;
//   if (x.title > y.title)
//     return 1;
//   return 0;
//  }

//#######################################################################
//# Broker
//#######################################################################
xpub = zmq.socket('xpub').bind(config.zmqSockets.broker.xpub);
xsub = zmq.socket('xsub').bind(config.zmqSockets.broker.xsub);

xsub.on('message', function(topic, message) { //xpub will send to logstash when xsub receive something
  console.log("xsub: ", topic.toString(), parseJSON(message))
  return xpub.send([topic, message]);
});

xpub.on('message', xsub.send.bind(xsub));

rrBroker = new RRBroker({
  router: config.zmqSockets.broker.router,
  dealer: config.zmqSockets.broker.dealer
});

responder = new Responder({
  dealer: config.zmqSockets.broker.dealer
}).socket;

//#######################################################################
//# OBSERVABLES
//#######################################################################
heartBeat$ = Rx.Observable.interval(3000);
notifyCache$ = Rx.Observable.timer(2000, 60000);
notifications$ = Rx.Observable.fromEvent(notifications, 'message', function(topic, message) {
  return [topic.toString(), parseJSON(message)];
});
anchorStatus$ = notifications$.filter(function([topic, message]) {
  var ref;
  return topic === config.notifications.anchorStatus && ((ref = cache.anchor) != null ? ref[message != null ? message.anchorId : void 0] : void 0);
});
databaseUpdate$ = notifications$.filter(function([topic, message]) {
  return topic === config.notifications.databaseUpdate;
});
responder$ = Rx.Observable.fromEvent(responder, 'message', function(topic, message) {
  console.log(topic.toString(), parseJSON(message))
  return [topic.toString(), parseJSON(message)];
});

//#######################################################################
//# SUBSCRIBE
//#######################################################################
pool = connectServer();
heartBeat$.subscribe(function() {
  console.log('sending heartbeat');
  return notify.send([config.notifications.serverHeartBeat, parseJSON(null)]);
});
notifyCache$.subscribe(function() {
  console.log('notify cache update');
  return notifyCacheUpdate();
});
databaseUpdate$.subscribe(function([topic, message]) {
  console.log('database changed');
  cacheVersion += 1;
  return notifyCacheUpdate();
});
anchorStatus$.subscribe(function([topic, message]) {
  return updateAnchorStatus(message);
});
responder$.subscribe(function([topic, message]) {
  var anchorId, data, rssi, type, uuid;
  console.log(topic);
  // cache request
  if (topic === config.notifications.cacheRequest) {
    console.log('cache request');
    return responder.send(stringifyJSON(cache));
  // connection request
  } else if (topic === config.notifications.connectGattRequest) {
    ({uuid, anchorId, rssi} = message);
    // distanceIndex = distanceIndex + 1
    // MP = determineMeasuredPower(anchorId)
    // distance = findDistance(rssi, MP)
    // dataList[anchorId] = distance
    // numAnchors = findConnectingAnchors(2)
    // console.log dataList
    data = {
      connect: rssi > -90 ? true : false,
      // connect:  if distance < 2 then true else false  
      lease: 20000,
      minRssi: -80,
      // delay:    if rssi > -75 then 0 else (-75 - rssi) * 10
      delay: (-75 - rssi) * 10
    };
    // delay:    if distance < 2 and numAnchors == 1 then 0 else if distance < 2 and numAnchors > 1 then distance.toFixed(2) * 10
    console.log(`anchor ${anchorId} uuid ${uuid} at ${rssi}`, data);
    return responder.send(stringifyJSON(data));
  //adding gatt request
  } else if (topic === config.notifications.gattAddition) {
    ({uuid, anchorId, rssi, type} = message);
    if (type != null) {
      console.log(`Adding Gatt Beacon ${uuid}`);
      findBeacon(pool, uuid).then((beaconIsFound) => {
        if (!beaconIsFound) {
          findBeaconByDevice(pool, type).then((beaconArray) => {
            var indexArr, results;
            indexArr = 0;
            results = [];
            while (indexArr < 5) {
              if (beaconArray.indexOf(indexArr) === -1) {
                inputGatt(pool, String(uuid), type, type + String(indexArr), -62);
                break;
              }
              results.push(indexArr = indexArr + 1);
            }
            return results;
          });
        }
        return console.log(`Gatt Device ${uuid} added...`);
      });
    }
    data = {
      connect: rssi > -65 ? true : false,
      lease: 20000,
      minRssi: -65,
      delay: rssi > -65 ? 0 : (-65 - rssi) * 10
    };
    console.log(`anchor ${anchorId} uuid ${uuid} at ${rssi}`, data);
    return responder.send(stringifyJSON(data));
  }
});