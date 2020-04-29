Rx        = require 'rxjs/Rx'
Requester = require './Requester'
Responder = require './Responder'
Broker    = require './Broker'
config    = require './config'

############################################################################
## ENTITIES
############################################################################

broker = new Broker({
  router: config.sockets.router,
  dealer: config.sockets.dealer
})

requester1  = new Requester({
  router: config.sockets.router,
  timeout: 1000
})

requester2  = new Requester({
  router: config.sockets.router,
  timeout: 1000
})

responder = new Responder({
  dealer: config.sockets.dealer
  response: (message) ->
    return "from responder: #{message}"
})

############################################################################
## SIMULATE REQUESTERS
############################################################################

Rx.Observable.interval(100)
.flatMap ->
  return Rx.Observable.bindNodeCallback(requester1.request.bind(requester1))('from req 1')
.catch (err) ->
  console.log 'error: req 1 timeout'
.retry()
.subscribe (message) ->  
  console.log "req 1 got reply:", message.toString()

Rx.Observable.interval(300)
.flatMap ->
  return Rx.Observable.bindNodeCallback(requester2.request.bind(requester2))('from req 2')
.catch (err) ->
  console.log 'error: req 2 timeout'
.retry()
.subscribe (message) ->  
  console.log "req 2 got reply:", message.toString()

############################################################################
## TESTS
############################################################################

# Simulate responder crash
# - show that packets when server crash is lost
crashResponder = ->
  Rx.Observable.timer(3000)
  .do -> 
    console.log 'closing responder'
    responder.socket.close()
  .delay(10000)
  .do ->
    console.log 'starting responder'
    responder = new Responder({
      dealer: config.sockets.dealer
      response: (message) ->
        return "from responder: #{message}"
    })
  .repeat()
  .subscribe()

# Simulate broker crash
# - show that packets when server crash is lost
crashBroker = ->
  Rx.Observable.timer(3000)
  .do -> 
    console.log 'closing broker'
    broker.routerSocket.close()
    broker.dealerSocket.close()
  .delay(10000)
  .do ->
    console.log 'starting broker'
    broker = new Broker({
      router: config.sockets.router,
      dealer: config.sockets.dealer
    })
  .repeat()
  .subscribe()

############################################################################
## RUN TESTS
############################################################################

# crashBroker()
crashResponder()
