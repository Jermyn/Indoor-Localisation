zmq       = require 'zeromq'
axios     = require 'axios'
moment    = require 'moment'
_         = require 'underscore'
Promise   = require 'bluebird'
Rx        = require 'rxjs/Rx'
config    = require '../config'
RRBroker  = require('./proxy_req_rep/Broker')
Responder = require('./proxy_req_rep/Responder')
pg        = require('pg')

########################################################################
## ZMQ SOCKETS
########################################################################

notify        = zmq.socket('pub').connect(config.zmqSockets.broker.xsub)
notifications = zmq.socket('sub').connect(config.zmqSockets.broker.xpub)
                .subscribe(config.notifications.anchorStatus)
                .subscribe(config.notifications.databaseUpdate)
                .subscribe(config.notifications.connectGattRequest)

########################################################################
## State
########################################################################

cache         = {}
anchors       = {}
cacheVersion  = 0
max           = -150
newAnchor     = null
state 		    = 0
pUuid 		    = null
anchorConnect = null

########################################################################
## UTILITIES
########################################################################

stringifyJSON = (obj) ->
  try
    JSON.stringify obj, null, 2
  catch e
    null

parseJSON = (obj) ->
  try
    JSON.parse obj
  catch e
    null

connectServer = ->
  pool = new pg.Pool({
  user: 'macpro',
  host: '127.0.0.1',
  database: 'indoor-localization-2.0',
  # password: 123,
  port: 5432});
  # pool.query("SELECT * FROM beacon", (err, res) => console.log err)
  # pool.end()
  return pool

request = ({query, variables}) ->
  axios({
    method:   'post'
    url:      config.apiServer.graphql.url
    headers:  {'Content-Type': 'application/json'}
    data:     JSON.stringify({query, variables})
  })

getCache = ->
  request({
    variables: null
    query: '
      query {
        devices{
          id
          type
          location
          anchor {
            id
            sensitivity
            measuredPower
            offset
          }
          beacon {
            id
            measuredPower
          }
          gatt {
            id
            connect
            profile
          }
        }
        anchors {
          id
          sensitivity
          measuredPower
          offset
          device {
            id
            type
            location
          }
        }
        beacons {
          id
          measuredPower
          device {
            id
            type
            location
          }
        }
        gatts {
          id
          connect
          profile
          device {
            id
            type
            location
          }
        }
        maps {
          id
          scale
          coordinates
          imageURL
          navMesh
        }
      }
    '
  })
  .then ({data}) ->
    cache = _.mapObject(data.data, (val, key) -> _.indexBy(val, 'id'))
    cache.version = cacheVersion
    console.log "loaded cache version", cache.version
    console.log stringifyJSON(cache)

notifyCacheUpdate = (version) ->
  getCache().then ->
    notify.send([
      config.notifications.cacheUpdate,
      stringifyJSON({
        version:  cacheVersion
      })
    ])

inputBeacon = (pool, id, deviceid, measuredpower) ->
  pool.query("INSERT INTO beacon(id, measuredpower, deviceid) VALUES('#{id}', '#{measuredpower}', '#{deviceid}')", (err, res) => if err==undefined then console.log "Successfully Inserted" else console.log err)
  pool.query("INSERT INTO device(id, type, location) VALUES('#{deviceid}', 'mobile', '[]')", (err, res) => if err==undefined then console.log "Successfully Inserted" else console.log err)
  pool.end()

findBeaconByDevice = (pool, type) ->
  deviceType = []
  index = 0
  return new Promise (resolve, reject) ->
    pool.query("SELECT deviceid FROM gatt", (err, res) => 
      if err
        console.log "Error finding Beacon"
        reject(0)
      else
        while (index < res.rows.length)
          if res.rows[index].deviceid.indexOf(type) !=-1
            deviceType.push(parseInt(res.rows[index].deviceid.match(/\d+/)[0]))
          index = index + 1
        resolve(deviceType))

inputGatt = (pool, id, profile, deviceid, measuredpower) ->
  if profile == "imu"
    characteristics = '{"fff0": {"fff1": {"notify": true}}}'
  else if profile == "ecg"
    characteristics = '{
                "fff0": {
                  "fff4": {"notify": true},
                  "fff3": {
                    "write": {
                      "data": [6],
                      "timer": [100]
                    }
                  }
                }
              }'
  else if profile == "hr"
    characteristics = '{"180d": {"2a37": {"notify": true}}}'
  pool.query("INSERT INTO gatt(id, profile, connect, deviceid) VALUES('#{id}', '#{characteristics}', false, '#{deviceid}')", (err, res) => if err==undefined then console.log "Successfully Inserted" else console.log err)
  pool.query("INSERT INTO device(id, type, location) VALUES('#{deviceid}', 'mobile', '[]')", (err, res) => if err==undefined then console.log "Successfully Inserted" else console.log err)
  pool.query("INSERT INTO beacon(id, measuredpower, deviceid) VALUES('#{id}', '#{measuredpower}', '#{deviceid}')", (err, res) => if err==undefined then console.log "Successfully Inserted" else console.log err)
  # pool.end()

deleteGatt = (pool, id) ->
  pool.query("DELETE FROM gatt WHERE id='#{id}'", (err) => if err==undefined then console.log "Successfully deleted" else console.log err)
  pool.end()

findBeacon = (pool, id) ->
  return new Promise (resolve, reject) ->
    pool.query("SELECT id FROM beacon WHERE id='#{id}'", (err, res) => 
      if err
        console.log "Error finding Beacon"
        reject(0)
      else
        # console.log res
        if res.rows[0]?.id == id
          console.log "Found Beacon #{id}"
          resolve(res.rows[0].id == id)
        else
          console.log "Beacon #{id} doesn't exist"
          resolve(false))

checkMax = ->
      Object.keys(anchors).forEach (key) ->
        if anchors[key] > max
          max = anchors[key]
          anchorConnect = key
      console.log("Anchor #{anchorConnect} has highest RSSI #{max}")
      data = {
        lease:    1800000
        minRssi:  -80
        delay:    0
        maxLoss:  10
        pUuid:	  pUuid
        anchorId: anchorConnect
      }
      time = (new Date()).getTime()
      console.log("Permission granted for Anchor #{anchorConnect} to connect to peripheral #{pUuid} at timestamp #{time} Data sent: ", data)
      resetMax()
      notify.send([config.notifications.connectPermission, stringifyJSON(data)])
      


resetMax = ->
  max = -150
  anchorConnect = null
  pUuid = null
  state = 0
  data = {}

create = (callback) ->
  state = 0
  return { 
    getState   : ->  return state,
    setState   : (p) -> 
                    state = p
                    callback(state)
  }

########################################################################
## Broker
########################################################################

xpub = zmq.socket('xpub').bind(config.zmqSockets.broker.xpub)
xsub = zmq.socket('xsub').bind(config.zmqSockets.broker.xsub)

xsub.on('message', (topic, message) -> xpub.send([topic, message]))
xpub.on('message', xsub.send.bind(xsub))

rrBroker  = new RRBroker({
  router: config.zmqSockets.broker.router
  dealer: config.zmqSockets.broker.dealer
})

responder = new Responder({
  dealer: config.zmqSockets.broker.dealer
}).socket

########################################################################
## OBSERVABLES
########################################################################

heartBeat$          = Rx.Observable.interval(3000)

notifyCache$        = Rx.Observable.timer(2000, 60000)

notifications$      = Rx.Observable.fromEvent(notifications, 'message', (topic, message) -> [topic.toString(), parseJSON(message)])

anchorStatus$       = notifications$
                      .filter ([topic, message]) -> 
                        topic == config.notifications.anchorStatus && cache.anchor?[message?.anchorId]

databaseUpdate$     = notifications$
                      .filter ([topic, message]) -> 
                        topic == config.notifications.databaseUpdate

responder$          = Rx.Observable.fromEvent(responder, 'message', (topic, message) -> [topic.toString(), parseJSON(message)])

connectGattRequest$ = notifications$
                      .filter ([topic, message]) -> 
                        topic == config.notifications.connectGattRequest


########################################################################
## SUBSCRIBE
########################################################################

pool = connectServer()

heartBeat$.subscribe ->
  console.log 'sending heartbeat'
  notify.send([config.notifications.serverHeartBeat, parseJSON(null)])

notifyCache$.subscribe ->
  console.log 'notify cache update'
  notifyCacheUpdate()

databaseUpdate$.subscribe ([topic, message]) ->
  console.log 'database changed'
  cacheVersion += 1
  notifyCacheUpdate()

anchorStatus$.subscribe ([topic, message]) ->
  updateAnchorStatus(message)

# connectGattRequest$.subscribe ([topic,message]) ->
#    { uuid, anchorId, rssi } = message
#    checkMax(rssi, anchorId)
#    Rx.Observable.timer(50).subscribe ->
#     data = {
#       connect:  if rssi == max and anchorId == anchorConnect then true else false
#       lease:    60000
#       minRssi:  -80
#       delay:    0
#       maxLoss:  10
#       pUuid:	uuid
#       anchorId: anchorId 
#     }
#     if data.connect == true
#       resetMax()
#     console.log "anchor #{anchorId} uuid #{uuid} at #{rssi}", data
#     notify.send([config.notifications.connectPermission, stringifyJSON(data)])

connectGattRequest$.subscribe ([topic,message]) ->
    { uuid, anchorId, rssi } = message
    pUuid = uuid
    if !anchors[anchorId]?
      anchors[anchorId] = {}
    anchors[anchorId] = rssi
    if (state == 0)
      window.setState(1)
    console.log "Anchor #{anchorId} with #{rssi} RSSI requesting connection to #{uuid}"



# responder$.subscribe ([topic, message]) ->
#   # cache request
#   if topic == config.notifications.cacheRequest
#     console.log 'cache request'
#     responder.send(stringifyJSON(cache))
#   # connection request
#   else if topic == config.notifications.connectGattRequest
#     { uuid, anchorId, rssi } = message
#     checkMax(rssi, anchorId)
#     Rx.Observable.timer(50).subscribe ->
#       data = {
#         connect:  if rssi == max and anchorId == anchorConnect then true else false
#         lease:    60000
#         minRssi:  -80
#         delay:    0
#         maxLoss:  10 
#       }
#       if data.connect == true
#         resetMax()
#       console.log "anchor #{anchorId} uuid #{uuid} at #{rssi}", data
#       responder.send(stringifyJSON(data))
#   #adding gatt request
#   else if topic == config.notifications.gattAddition
#     { uuid, anchorId, rssi, type } = message
#     if type? 
#       console.log "Adding Gatt Beacon #{uuid}"
#       findBeacon(pool, uuid).then((beaconIsFound) =>
#         if !beaconIsFound
#           findBeaconByDevice(pool, type).then((beaconArray) => 
#            indexArr=0
#            while (indexArr < 5)
#               if beaconArray.indexOf(indexArr) == -1
#                 inputGatt(pool, String(uuid), type, type+String(indexArr),-62)
#                 break
#               indexArr = indexArr + 1)
#         console.log "Gatt Device #{uuid} added...")
#     data = {
#       connect:  if rssi > -65 then true else false
#       lease:    60000
#       minRssi:  -65
#       delay:    if rssi > -65 then 0 else (-65 - rssi) * 10
#     }
#     console.log "anchor #{anchorId} uuid #{uuid} at #{rssi}", data
#     responder.send(stringifyJSON(data))

responder$.subscribe ([topic, message]) ->
  # cache request
  if topic == config.notifications.cacheRequest
    console.log 'cache request'
    responder.send(stringifyJSON(cache))
  #adding gatt request
  else if topic == config.notifications.gattAddition
    { uuid, anchorId, rssi, type } = message
    if type? 
      console.log "Adding Gatt Beacon #{uuid}"
      findBeacon(pool, uuid).then((beaconIsFound) =>
        if !beaconIsFound
          findBeaconByDevice(pool, type).then((beaconArray) => 
           indexArr=0
           while (indexArr < 5)
              if beaconArray.indexOf(indexArr) == -1
                inputGatt(pool, String(uuid), type, type+String(indexArr),-62)
                break
              indexArr = indexArr + 1)
        console.log "Gatt Device #{uuid} added...")
    data = {
      connect:  if rssi > -65 then true else false
      lease:    60000
      minRssi:  -65
      delay:    if rssi > -65 then 0 else (-65 - rssi) * 10
    }
    console.log "anchor #{anchorId} uuid #{uuid} at #{rssi}", data
    responder.send(stringifyJSON(data))

# Rx.Observable.interval(350).subscribe ->
# 	checkMax()

window = create( (state) ->
  if (state == 1)
    Rx.Observable.timer(250).subscribe ->
      checkMax()
)