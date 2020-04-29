zmq       = require 'zmq'
Rx      = require 'rxjs/Rx'
moment    = require 'moment'
config    = require '../config'

########################################################################
## ZMQ SOCKETS
########################################################################

beaconData        = zmq.socket('pull').bind(config.zmqSockets.beaconData.pushpull)

beaconData.on('message', -> console.log message)


