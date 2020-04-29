var GraphQLJSON = require('graphql-type-json');
var Promise     = require('bluebird')
var _           = require('underscore')

module.exports = function(models) {
  return {
    Beacon: {
      device: (beacon) => Promise.fromCallback((cb) => beacon.device(cb))
    },
    Anchor: {
      device: (anchor) => Promise.fromCallback((cb) => anchor.device(cb))
    },
    Gatt: {
      device: (gatt) => Promise.fromCallback((cb) => gatt.device(cb))
    },
    Device: {
      anchor: (device) => Promise.fromCallback((cb) => device.anchors(cb)),
      beacon: (device) => Promise.fromCallback((cb) => device.beacons(cb)),
      gatt:   (device) => Promise.fromCallback((cb) => device.gatts(cb)),
    },
    Query: {
      beacon:   (root, {id}) => models.Beacon.findById(id),
      beacons:  () => models.Beacon.find(),
      anchor:   (root, {id}) => models.Anchor.findById(id),
      anchors:  () => models.Anchor.find(),
      gatt:     (root, {id}) => models.Gatt.findById(id),
      gatts:    () => models.Gatt.find(),
      device:   (root, {id}) => models.Device.findById(id),
      devices:  () => models.Device.find(),
      map:      (root, {id}) => models.Map.findById(id),
      maps:     () => models.Map.find()
    },
    Mutation: {
      createMap: (root, {input}) => {
        return models.Map.create(input)
      },
      updateMap: (root, {input}) => {
        return models.Map.findById(input.id)
        .then((map) => map.updateAttributes(input))
      },
      deleteMap: (root, {id}) => models.Map.destroyById(id),
      createDevice: (root, {input}) => {
        return models.Device.create(input.device)
        .then((device) => {
          return Promise.all([
            input.beacon ? device.beacons.create(input.beacon).catch(() => Promise.resolve()) : Promise.resolve(),
            input.anchor ? device.anchors.create(input.anchor).catch(() => Promise.resolve()) : Promise.resolve(),
            input.gatt ? device.gatts.create(input.gatt).catch(() => Promise.resolve()) : Promise.resolve()
          ])
          .then(() => models.Device.findById(device.id))
        })
      },
      updateDevice: (root, {input}) => {
        return models.Device.findById(input.device.id)
        .then((device) => {
          return Promise.all([
            device.updateAttributes(input.device),
            device.anchors.getAsync().then((anchor) => {
              if (anchor && input.anchor) {
                return anchor.updateAttributes(input.anchor)
              } else if (!anchor && input.anchor) {
                return device.anchors.create(input.anchor)
              }
            }),
            device.gatts.getAsync().then((gatt) => {
              if (gatt && input.gatt) {
                return gatt.updateAttributes(input.gatt)
              } else if (!gatt && input.gatt) {
                return device.gatts.create(input.gatt)
              }
            }),
            device.beacons.getAsync().then((beacon) => {
              if (beacon && input.beacon) {
                return beacon.updateAttributes(input.beacon)
              } else if (!beacon && input.beacon) {
                return device.beacons.create(input.beacon)
              }
            })
          ])
        })
        .then(() => models.Device.findById(input.device.id))
      },
      deleteDevice: (root, {id}) => models.Device.destroyById(id)
    },
    JSON: GraphQLJSON
  }
}
