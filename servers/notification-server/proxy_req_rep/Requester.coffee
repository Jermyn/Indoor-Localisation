zmq  = require 'zeromq'
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
      .take(1)
      .timeout(@timeout)
      .map (reply) ->
        return {callback, reply}
      .catch (err) ->
        callback(err)
        return Rx.Observable.throw(err)
    .catch (err) =>
      @restartSocket()
    .retry()
    .subscribe ({callback, reply}) ->
      callback(null, reply)

  restartSocket: ->
    @socket.close()
    @socket = zmq.socket('req').connect(@router)

  request: (message, callback) ->
    @bus.next({message, callback})
