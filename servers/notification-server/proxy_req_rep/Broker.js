zmq = require('zeromq');

module.exports = Broker = class Broker {
  constructor({router, dealer}) {
    this.routerSocket = zmq.socket('router').bindSync(router);
    this.dealerSocket = zmq.socket('dealer').bindSync(dealer);
    this.routerSocket.on('message', () => {
      return this.dealerSocket.send(Array.apply(null, arguments));
    });
    this.dealerSocket.on('message', () => {
      return this.routerSocket.send(Array.apply(null, arguments));
    });
  }
};