zmq = require('zeromq');
Rx = require('rxjs/Rx');

module.exports = Requester = class Requester {
  constructor({router, timeout}) {
    this.router = router;
    this.timeout = timeout;
    this.socket = zmq.socket('req').connect(this.router);
    this.bus = new Rx.Subject();
    this.bus.observeOn(Rx.Scheduler.queue).flatMap(({message, callback}) => {
      this.socket.send(message);
      return Rx.Observable.fromEvent(this.socket, 'message').take(1).timeout(this.timeout).map(function(reply) {
        return {callback, reply};
      }).catch(function(err) {
        callback(err);
        return Rx.Observable.throw(err);
      });
    }).catch((err) => {
      return this.restartSocket();
    }).retry().subscribe(function({callback, reply}) {
      return callback(null, reply);
    });
  }

  restartSocket() {
    this.socket.close();
    return this.socket = zmq.socket('req').connect(this.router);
  }

  request(message, callback) {
    return this.bus.next({message, callback});
  }
};
