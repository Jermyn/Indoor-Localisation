noble     = require 'noble'
Rx        = require 'rxjs/Rx'
fs        = require 'fs'
_         = require 'underscore'
zmq       = require 'zmq'
config    = require(__dirname + '/configs/config.json')
ibeacon   = require './ibeacon'
log       = require './log'
Requester = require('./Requester')

############################################################################################################
## ENVIRONMENT
############################################################################################################ 

process.title = 'anchor'
env           = _.pick(process.env, 'ANCHOR', 'UUID', 'MAJOR', 'MINOR', 'MEASURED_POWER', 'BLENO_ADVERTISING_INTERVAL', 'NOBLE_MULTI_ROLE', 'NOBLE_REPORT_ALL_HCI_EVENTS')

############################################################################################################
## STATE
############################################################################################################ 

syslog        = {}
cache         = {}
filters       = {}
state         = { 
                  env
                  noble:
                    state:    noble.state
                    scanning: false
                  boot:       (new Date()).getTime()
                }

############################################################################################################
## ZMQ SOCKETS
############################################################################################################ 

anchorData      = zmq.socket('push')
                  .setsockopt(zmq.ZMQ_SNDHWM, 2000)
                  .connect(config.zmqSockets.anchorData.pushpull)

beaconData      = zmq.socket('push')
                  .setsockopt(zmq.ZMQ_SNDHWM, 1000)
                  .connect(config.zmqSockets.beaconData.pushpull)

rawData         = zmq.socket('push')
                  .setsockopt(zmq.ZMQ_SNDHWM, 1000)
                  .connect(config.zmqSockets.rawData.pushpull)

notify          = zmq.socket('pub')
                  .connect(config.zmqSockets.broker.xsub)

notifications   = zmq.socket('sub')
                  .connect(config.zmqSockets.broker.xpub)
                  .subscribe(config.notifications.cacheUpdate)
                  .subscribe(config.notifications.serverHeartBeat)
                  .subscribe('Anchor' + env.ANCHOR)

requester       = new Requester({
  router:   config.zmqSockets.broker.router
  timeout:  2000
})

############################################################################################################
## FUNCTIONS
############################################################################################################ 

stringifyJSON = (obj) ->
  try
    return JSON.stringify(obj)
  catch err
    return null
  
parseJSON = (obj) ->
  try
    return JSON.parse(obj)
  catch err
    return null

updateSyslog = ->
  log.getCurrentState()
  .then (res) ->
    syslog = res
  .catch (err) ->
    console.log 'error: cannot update syslog'
    syslog = {}

updateFilter = (id, rssi, time) ->
  # create
  if !filters[id]?
    filters[id] = {
      mu:         rssi,
      sigma:      1000,
      lastUpdate: time,
      period:     1000,
      alpha:      0.05
    }
  f = filters[id]
  # mean, variance calculation
  diff = rssi - f.mu
  incr = f.alpha * diff
  f.mu += incr
  f.sigma = (1 - f.alpha) * (f.sigma + diff * incr)
  # period calculation
  diff = time - f.lastUpdate - f.period
  incr = 0.01 * diff
  f.period += incr
  f.lastUpdate = time
  # adapt alpha
  f.alpha = if f.period > 1000 then 0.2 else f.period * 0.0001667 + 0.0333
  return f

updateCache = (res) ->
  cache = res
  console.log('loaded cache version', cache.version)
  console.log cache

cacheRequestObservable = ->
  console.log 'requesting cache'
  return Rx.Observable.bindNodeCallback(requester.request.bind(requester))([config.notifications.cacheRequest, stringifyJSON(null)])
  .map(parseJSON)
  .take(1)

connectedPeripherals = ->
  _.values(noble._peripherals).filter ({state}) -> state == 'connected'

attemptDisconnectPeripheral = (peripheral) ->
  if peripheral.state == 'connected'
    console.log "disconnecting from peripheral #{peripheral.uuid}"
    peripheral.disconnect()
  else
    console.log "unable to disconnect #{peripheral.uuid} with state #{peripheral.state}"

attemptConnectPeripheral = (peripheral) ->
  if peripheral.state == 'disconnected'
    console.log "connecting to peripheral #{peripheral.uuid}"
    peripheral.connect()
  else
    console.log "unable to connect #{peripheral.uuid} with state #{peripheral.state}"

attemptDiscoverServices = (peripheral, uuids) ->
  if peripheral.state == 'connected'
    console.log "discovering services #{uuids}"
    peripheral.discoverServices(uuids)
  else
    console.log "unable to discover services #{uuids} with state #{peripheral.state}"

restartNotifications = ->
  console.log 'error: server notifications timeout, restarting socket'
  notifications.disconnect(config.zmqSockets.broker.xpub)
  notifications.connect(config.zmqSockets.broker.xpub)

sendAnchorStatus = ->
  data = {
            state, syslog,
            anchorId:       env.ANCHOR
            gatts:          
              connected:    connectedPeripherals().map ({uuid}) -> uuid
            cache:
              version:      cache.version
          }
  notify.send([
    config.notifications.anchorStatus,
    stringifyJSON(data)
  ])

sendAchorData = (data) ->
  anchorData.send(stringifyJSON(data))

sendBeaconData = (data) ->
  beaconData.send(stringifyJSON(data))
  

sendRawData = (data) ->
  rawData.send(stringifyJSON(data))

gattRequestObservable = (peripheral) ->
  return Rx.Observable.bindNodeCallback(requester.request.bind(requester))(
    [
      config.notifications.connectGattRequest, 
      stringifyJSON({ uuid: peripheral.uuid, rssi: peripheral.rssi, anchorId: env.ANCHOR })
    ]
  )
  .map(parseJSON)
  .take(1)

gattAdditionRequestObservable = (peripheral) ->
  if peripheral.advertisement.localName.indexOf("RHYTHM") !=-1
    type = "hr"
  else if peripheral.advertisement.localName.indexOf("HomeRehab") !=-1
    type = "imu"
  else if peripheral.advertisement.localName.indexOf("BELBLE") !=-1
    type = "ecg"
  return Rx.Observable.bindNodeCallback(requester.request.bind(requester))(
    [
      config.notifications.gattAddition, 
      stringifyJSON({ uuid: peripheral.uuid, rssi: peripheral.rssi, anchorId: env.ANCHOR, type: type })
    ]
  )
  .map(parseJSON)
  .take(1)
  
############################################################################################################
## OBSERVABLES
############################################################################################################ 

noble$            = Rx.Observable.fromEvent(noble, 'stateChange')

updateSyslog$     = Rx.Observable.timer(100, 60000)

_anchorStatus$    = new Rx.Subject()

_rawData$         = new Rx.Subject() # REMOVE IN PRODUCTION

anchorStatus$     = Rx.Observable.merge(_anchorStatus$, Rx.Observable.timer(2000, 60000))

notifications$    = Rx.Observable.fromEvent(notifications, 'message', (topic, message) -> [topic.toString(), parseJSON(message)])

serverHeartBeat$  = notifications$
                    .filter ([topic, message]) -> 
                      topic == config.notifications.serverHeartBeat

cacheUpdates$     = notifications$
                    .filter ([topic, message]) -> 
                      topic == config.notifications.cacheUpdate && message?.version != cache?.version
                    .switchMap -> 
                      return cacheRequestObservable()
                    .retry()

discover$         = Rx.Observable.fromEvent(noble, 'discover')

[ _iBeacons$ 
  __macBeacons$ ] = discover$.partition (peripheral) -> 
                      ibeacon.isBeacon(peripheral.advertisement.manufacturerData)


_macBeacons$      = __macBeacons$.share()

macBeacons$       = _macBeacons$
                    .filter (b) ->
                      cache.beacons?[b.uuid] && cache.anchors?[env.ANCHOR]
                    .map (b) ->
                      transmitterId:  cache.beacons[b.uuid].device.id
                      receiverId:     cache.anchors[env.ANCHOR].device.id
                      offset:	      cache.anchors[env.ANCHOR].offset
                      rssi:           b.rssi

iBeacons$         = _iBeacons$
                    .map(ibeacon.toBeacon)
                    .filter (b) ->
                      console.log b
                      b.uuid == env.UUID && 
                      cache.beacons?["#{b.major}:#{b.minor}"] && 
                      cache.anchors?[env.ANCHOR]
                    .map (b) ->
                      transmitterId:  cache.beacons["#{b.major}:#{b.minor}"].device.id
                      receiverId:     cache.anchors[env.ANCHOR].device.id
                      offset:	      cache.anchors[env.ANCHOR].offset
                      rssi:           b.rssi

iBeaconsToAdd$    = _iBeacons$
                    .map(ibeacon.toBeacon)
                    .filter (b) ->
                      b.uuid == env.UUID && 
                      !cache.beacons?["#{b.major}:#{b.minor}"] && 
                      cache.anchors?[env.ANCHOR]
                    .map (b) ->
                      transmitterId:  "#{b.major}:#{b.minor}"
                      receiverId:     cache.anchors[env.ANCHOR].device.id
                      offset:       cache.anchors[env.ANCHOR].offset
                      rssi:           b.rssi

beacons$          = Rx.Observable.merge(iBeacons$, macBeacons$)

beaconsToAdd$     = Rx.Observable.merge(iBeaconsToAdd$, macBeacons$)

gattBeaconsToAdd$ = _macBeacons$
                    .filter (peripheral) -> 
                      (!cache.gatts?[peripheral.uuid] && peripheral.state == 'disconnected') && (peripheral.advertisement.localName.indexOf("RHYTHM") !=-1 || peripheral.advertisement.localName.indexOf("HomeRehab") !=-1 || peripheral.advertisement.localName.indexOf("BELBLE") !=-1)
                        # console.log peripheral.advertisement.localName
                    .share()

gattBeacons$      = _macBeacons$
                    .filter (peripheral) -> 
                      if cache.gatts?[peripheral.uuid] && cache.gatts?[peripheral.uuid]?.connect && peripheral.state == 'disconnected'
                        console.log peripheral
                    .share()



gattConnections$  = gattBeacons$
                    .groupBy (peripheral) -> peripheral.uuid
                    .flatMap (group) -> group.throttleTime(1000)
                    .observeOn(Rx.Scheduler.queue)
                    .flatMap (peripheral) ->
                      console.log "requesting permission to connect to #{peripheral.uuid}"
                      return gattRequestObservable(peripheral)
                      .filter ({connect}) -> 
                        connect && peripheral.state == 'disconnected'
                      .map ({lease, minRssi}) ->
                        return { peripheral, lease, minRssi }
                    .retry()

gattAddition$  = gattBeaconsToAdd$
                .groupBy (peripheral) -> peripheral.uuid
                .flatMap (group) -> group.throttleTime(1000)
                .observeOn(Rx.Scheduler.queue)
                .flatMap (peripheral) ->
                  console.log "requesting permission to add #{peripheral.uuid}"
                  return gattAdditionRequestObservable(peripheral)
                  .filter ({connect}) -> 
                    connect && peripheral.state == 'disconnected'
                  .map ({lease, minRssi}) ->
                    return { peripheral, lease, minRssi }
                .retry()

nobleConnect$         = Rx.Observable.fromEvent(noble._bindings, 'connect')
nobleDisconnect$      = Rx.Observable.fromEvent(noble._bindings, 'disconnect')
nobleServices$        = Rx.Observable.fromEvent(noble._bindings, 'servicesDiscover', (peripheralUuid, serviceUuids) -> [peripheralUuid, serviceUuids])
nobleCharacteristics$ = Rx.Observable.fromEvent(noble._bindings, 'characteristicsDiscover', (peripheralUuid, serviceUuid, characteristicsDesc) -> [peripheralUuid, serviceUuid, characteristicsDesc])
nobleRead$            = Rx.Observable.fromEvent(noble._bindings, 'read', (peripheralUuid, serviceUuid, characteristicUuid, data, isNotification) -> [peripheralUuid, serviceUuid, characteristicUuid, data, isNotification])

############################################################################################################
## SUBSCRIPTIONS
############################################################################################################ 

# noble
noble$.subscribe (res) ->
  if res == 'poweredOn'
    console.log('hci', res, 'start scanning')
    noble.startScanning([], true)
    state.noble.scanning = true
  else
    console.log('hci', res, 'stop scanning')
    noble.stopScanning()
    state.noble.scanning = false

# heart beats
serverHeartBeat$
.timeout(10000)
.catch (err) ->
  restartNotifications()
  return Rx.Observable.throw(err)
.retry()
.subscribe()

# syslog
updateSyslog$.subscribe ->
  updateSyslog()

# cache updates
cacheUpdates$.subscribe (res) -> 
  updateCache(res)
  _anchorStatus$.next()

# anchor status
anchorStatus$.subscribe -> 
  sendAnchorStatus()

# raw data - REMOVE IN PRODUCTION
_rawData$.subscribe (data) ->
  sendRawData(data)

# beacons
beacons$
.do ({transmitterId, receiverId, offset, rssi}) -> 
  time = (new Date()).getTime()
  _rawData$.next({time, transmitterId, receiverId, rssi}) # REMOVE IN PRODUCTION
  updateFilter(transmitterId, rssi+offset, time)
.groupBy ({transmitterId}) -> transmitterId
.flatMap (group) -> group.throttleTime(100)
.bufferTime(1000)
.map (arr) ->
  return arr.map ({transmitterId, receiverId}) ->
    { 
      transmitterId, receiverId,
      mu:      filters[transmitterId].sigma,
      sigma:   filters[transmitterId].sigma,
      period:  filters[transmitterId].period
    }
.subscribe (arr) ->
  sendBeaconData(arr)

# beacons
beaconsToAdd$
.do ({transmitterId, receiverId, offset, rssi}) -> 
  time = (new Date()).getTime()
  _rawData$.next({time, transmitterId, receiverId, rssi}) # REMOVE IN PRODUCTION
  updateFilter(transmitterId, rssi+offset, time)
.groupBy ({transmitterId}) -> transmitterId
.flatMap (group) -> group.throttleTime(100)
.bufferTime(1000)
.map (arr) ->
  return arr.map ({transmitterId, receiverId}) ->
    { 
      transmitterId, receiverId,
      mu:      filters[transmitterId].sigma,
      sigma:   filters[transmitterId].sigma,
      period:  filters[transmitterId].period
    }
.subscribe (arr) ->
  sendBeaconData(arr)

# gatt
gattConnections$
.subscribe ({peripheral, lease, delay, minRssi}) ->
  console.log peripheral
  peripheral.contract = { lease, minRssi, delay }
  if delay?
    Rx.Observable.timer(delay).subscribe ->
      console.log "connecting after #{delay} ms"
      attemptConnectPeripheral(peripheral)
  else
    attemptConnectPeripheral(peripheral)

# Adding gatt
gattAddition$
.subscribe ({peripheral, lease, delay, minRssi}) ->
  peripheral.contract = { lease, minRssi, delay }
  if delay?
    Rx.Observable.timer(delay).subscribe ->
      console.log "connecting after #{delay} ms"
      # attemptConnectPeripheral(peripheral)
  else
    console.log "connecting after #{delay} ms"
    # attemptConnectPeripheral(peripheral)
  console.log "Adding #{peripheral.uuid} to device server"

nobleConnect$
.subscribe (uuid) ->
  console.log "connected to #{uuid}"
  peripheral    = noble._peripherals[uuid]
  serviceUUIDs  = _.keys(cache.gatts[uuid]?.profile?)
  attemptDiscoverServices(peripheral, serviceUUIDs)
  # send status
  _anchorStatus$.next()
  # disconnect on lease
  if peripheral.contract?.lease?
    console.log "lease for #{peripheral.contract.lease}"
    Rx.Observable.timer(peripheral.contract.lease)
    .takeUntil(nobleDisconnect$.filter (uuid) -> uuid == peripheral.uuid)
    .subscribe -> 
      console.log "lease expired for #{peripheral.uuid}"
      attemptDisconnectPeripheral(peripheral)
  # disconnect on minRssi exceeded
  if peripheral.contract?.minRssi?
    console.log "connect untill rssi < #{peripheral.contract.minRssi}"
    Rx.Observable.interval(200)
    .flatMap -> Rx.Observable.bindNodeCallback(peripheral.updateRssi.bind(peripheral))()
    .takeUntil(nobleDisconnect$.filter (uuid) -> uuid == peripheral.uuid)
    .subscribe (rssi) ->
      transmitterId = cache.gatts?[uuid]?.device?.id
      updateFilter(transmitterId, rssi, time)
      if filters[transmitterId].mu < peripheral.contract.minRssi
        console.log "rssi exceeded for #{peripheral.uuid}"
        attemptDisconnectPeripheral(peripheral)

      # REMOVE IN PRODUCTION
      time = (new Date()).getTime()
      receiverId    = cache.anchors?[env.ANCHOR]?.device?.id
      _rawData$.next({time, transmitterId, receiverId, rssi})

nobleServices$
.subscribe ([peripheralUuid, serviceUuids]) ->
  console.log "discovered services #{serviceUuids} for #{peripheralUuid}"
  services = noble._services[peripheralUuid]
  serviceUuids.forEach (uuid) ->
    if cache.gatts?[peripheralUuid]?.profile?[uuid]
      characteristicUUIDs = _.keys(cache.gatts?[peripheralUuid]?.profile?[uuid])
      services[uuid].discoverCharacteristics(characteristicUUIDs)

nobleCharacteristics$
.subscribe ([peripheralUuid, serviceUuid, characteristicsDesc]) ->
  console.log "discovered #{characteristicsDesc.length} characteristics for #{serviceUuid}"
  characteristics = noble._characteristics[peripheralUuid][serviceUuid]
  characteristicsDesc.forEach ({uuid}) ->
    if cache.gatts[peripheralUuid].profile[serviceUuid][uuid]
      # notify
      if cache.gatts[peripheralUuid].profile[serviceUuid][uuid].notify
        characteristics[uuid].subscribe()
        # disconnect if data not read within time period
        nobleRead$
        .filter ([_peripheralUuid, _serviceUuid, _characteristicUuid, _data, _isNotification]) ->
          _peripheralUuid == peripheralUuid && _serviceUuid == serviceUuid && _characteristicUuid == uuid
        .take(1)
        .timeout(1000)
        .catch (err) ->
          console.log "failed to read #{uuid} within time period"
          attemptDisconnectPeripheral(noble._peripherals[peripheralUuid])
          console.log "read #{uuid} successful"
      # write
      if cache.gatts[peripheralUuid].profile[serviceUuid][uuid].write
        data = cache.gatts[peripheralUuid].profile[serviceUuid][uuid].write.data
        timer = cache.gatts[peripheralUuid].profile[serviceUuid][uuid].write.timer
        Rx.Observable.timer.apply(this, timer)
        .subscribe ->
          console.log "writing #{data} to #{serviceUuid} #{uuid}"
          characteristics[uuid].write(new Buffer(data), true)

nobleRead$
.subscribe ([peripheralUuid, serviceUuid, characteristicUuid, data, isNotification]) ->
  sendAchorData({
    uuid:           peripheralUuid
    service:        serviceUuid
    characteristic: characteristicUuid
    data:           data.toString('base64')
    anchorId:       env.ANCHOR
  })

nobleDisconnect$
.subscribe (uuid) ->
  console.log "#{uuid} disconnected"
  # send status
  _anchorStatus$.next()

############################################################################################################
## Begin
############################################################################################################ 

Rx.Observable.defer(cacheRequestObservable)
.timeout(2000)
.retry()
.subscribe (res) ->
  updateCache(res)
  _anchorStatus$.next()
