zmq = require('zeromq');

module.exports = Responder = class Responder {
  constructor({dealer, response}) {
    this.socket = zmq.socket('rep').connect(dealer);
  }
};
