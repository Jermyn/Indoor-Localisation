'use strict';
var Rx      = require('rxjs/Rx');
var zmq     = require('zeromq');
var config  = require('../../../config');
var notify  = zmq.socket('pub').connect(config.zmqSockets.broker.xsub);

function stringifyJSON (obj) {
  try {
    return JSON.stringify(obj)
  }
  catch (err) {
    return null
  }
}

module.exports = function(app) {

  var Anchor  = app.models.Anchor;
  var Beacon  = app.models.Beacon;
  var Gatt    = app.models.Gatt;
  var Device  = app.models.Device;
  var Map     = app.models.Map;
  
  var change$ = new Rx.Subject()

  change$
  .throttleTime(2000)
  .subscribe(function () {
    notify.send([
      config.notifications.databaseUpdate, null
    ])
  })

  // Anchor
  Anchor.observe('after save', function(ctx, next) {
    change$.next()
    next()
  });
  Anchor.observe('after delete', function(ctx, next) {
    change$.next()
    next()
  });

  // Beacon
  Beacon.observe('after save', function(ctx, next) {
    change$.next()
    next()
  });
  Beacon.observe('after delete', function(ctx, next) {
    change$.next()
    next()
  });

  // Gatt
  Gatt.observe('after save', function(ctx, next) {
    change$.next()
    next()
  });
  Gatt.observe('after delete', function(ctx, next) {
    change$.next()
    next()
  });

  // Device
  Device.observe('after save', function(ctx, next) {
    change$.next()
    next()
  });
  Device.observe('after delete', function(ctx, next) {
    change$.next()
    next()
  });

  // Map
  Map.observe('after save', function(ctx, next) {
    change$.next()
    next()
  });
  Map.observe('after delete', function(ctx, next) {
    change$.next()
    next()
  });

};