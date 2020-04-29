zmq     = require 'zeromq'

module.exports = class Broker
  
  constructor: ({router, dealer}) ->
    
    @routerSocket = zmq.socket('router').bindSync(router)

    @dealerSocket  = zmq.socket('dealer').bindSync(dealer)

    @routerSocket.on 'message', =>
      @dealerSocket.send Array.apply(null, arguments)

    @dealerSocket.on 'message', =>
      @routerSocket.send Array.apply(null, arguments)