'use strict';

module.exports = function(app) {
  var Anchor  = app.models.Anchor
  var Beacon  = app.models.Beacon
  var Gatt    = app.models.Gatt
  var Device  = app.models.Device
  var Map     = app.models.Map
  
  ////////////////////////////////////////////////////////////////
  // Delete Device -> Delete Node + Delete Beacon
  ////////////////////////////////////////////////////////////////
  Device.observe('before delete', function(ctx, next) {
    Anchor.deleteAll({deviceId: ctx.where.id})
    .then(() => Beacon.deleteAll({deviceId: ctx.where.id}))
    .then(() => Gatt.deleteAll({deviceId: ctx.where.id}))
    .finally(() => next())
  });

  ////////////////////////////////////////////////////////////////
  // Delete Map -> Delete Device Location
  ////////////////////////////////////////////////////////////////
  Map.observe('before delete', function(ctx, next) {
    Device.find()
    .then(function (devices) {
      devices.forEach(function (device) {
        if (device.location && device.location.map && device.location.map.id == ctx.where.id) {
          device.updateAttributes({'location': null})
        } 
      })
    })
    .finally(() => next())
  });
  
};