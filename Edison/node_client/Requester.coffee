zmq  = require 'zmq'
Rx   = require 'rxjs/Rx'

module.exports = class Requester

  constructor: ({@router, @timeout}) ->
    @socket = zmq.socket('req').connect(@router)
    @bus    = new Rx.Subject()
    @bus
    .observeOn(Rx.Scheduler.queue)
    .flatMap ({message, callback}) =>
      @socket.send(message)
      return Rx.Observable.fromEvent(@socket, 'message')
      .timeout(@timeout)
      .take(1)
      .do (m) => callback(null, m)
      .catch (err) =>
        console.log 'callback timeout, restarting socket'
        @restartSocket()
        callback(err)
        return Rx.Observable.empty()
    .subscribe()

  restartSocket: ->
    @socket.close()
    @socket = zmq.socket('req').connect(@router)

  request: (message, callback) ->
    @bus.next({message, callback})
