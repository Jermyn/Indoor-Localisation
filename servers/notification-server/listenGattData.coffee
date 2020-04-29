zmq       = require 'zmq'
moment    = require 'moment'
Rx        = require 'rxjs/Rx'
config    = require '../config'

########################################################################
## ZMQ SOCKETS
########################################################################

beaconData        = zmq.socket('sub').connect(config.zmqSockets.broker.xpub)
                .subscribe(config.notifications.anchorStatus)

beaconData.on('message', (message) -> console.log(parseJSON(message)))
# console.log message

# rawData.on('message', (message) -> console.log(parseJSON(message)))




parseJSON = (obj) ->
  try
    JSON.parse obj
  catch e
    null

beaconObservable: (observer) ->
  while true
    data = beaconData.on('message', (message) -> parseJSON(message))
    observer.next(data)