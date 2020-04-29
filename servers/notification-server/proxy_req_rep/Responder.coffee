zmq     = require 'zeromq'

module.exports = class Responder

  constructor: ({dealer, response}) ->
    @socket = zmq.socket('rep').connect(dealer)
