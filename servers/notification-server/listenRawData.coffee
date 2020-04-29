zmq       = require 'zeromq'
moment    = require 'moment'
Rx        = require 'rxjs/Rx'
config    = require '../config'

########################################################################
## ZMQ SOCKETS
########################################################################

# beaconData        = zmq.socket('pull').bind(config.zmqSockets.beaconData.pushpull)
rawData           = zmq.socket('pull').bind("tcp://137.132.165.139:5567")

# beaconData.on('message', (message) -> console.log(parseJSON(message)))
# console.log message

rawData.on('message', (message) -> console.log(parseJSON(message)))




parseJSON = (obj) ->
  try
    JSON.parse obj
  catch e
    null

beaconObservable: (observer) ->
  while true
    data = beaconData.on('message', (message) -> parseJSON(message))
    observer.next(data)