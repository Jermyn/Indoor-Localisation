module.exports = `
  scalar JSON

  type Beacon {
    id:             String!
    measuredPower:  Int
    device:         Device
  }

  type Anchor {
    id:             String!
    device:         Device
    sensitivity:    Int
    measuredPower:  Float
    offset:         Float
  }

  type Gatt {
    id:             String!
    device:         Device
    profile:        JSON
    connect:        Boolean
  }

  type Device {
    id:         String!
    type:       String
    location:   JSON
    anchor:     Anchor
    beacon:     Beacon
    gatt:       Gatt
  }

  type Map {
    id:           String!
    image:        String
    imageURL:     String
    scale:        Float
    coordinates:  JSON
    navMesh:      JSON
    navPath:      JSON
    pois:         JSON
  }

  input BeaconInput {
    id:               String
    measuredPower:    Int
  }

  input AnchorInput {
    id:               String
    sensitivity:      Int
    measuredPower:    Float
    offset:           Float
  }

  input GattInput {
    id:               String
    profile:          JSON
    connect:          Boolean
  }

  input MapInput {
    id:             String
    scale:          Float
    coordinates:    JSON
    image:          String
    imageURL:       String
    navMesh:        JSON
    pois:           JSON
    navPath:        JSON
  }

  input DeviceInput {
    id:         String
    type:       String
    location:   JSON
  }
  
  input CreateDeviceInput {
    device:        DeviceInput
    anchor:        AnchorInput
    beacon:        BeaconInput
    gatt:          GattInput
  }

  type Query {
    beacon(id: String):   Beacon
    beacons:              [Beacon]
    anchor(id: String):   Anchor
    anchors:              [Anchor]
    gatt(id: String):     Gatt
    gatts:                [Gatt]
    device(id: String):   Device
    devices:              [Device]
    map(id: String):      Map
    maps:                 [Map]
  }

  type Mutation {
    createMap(input: MapInput!):             Map
    updateMap(input: MapInput!):             Map
    deleteMap(id: String!):                  Map
    createDevice(input: CreateDeviceInput!): Device
    updateDevice(input: CreateDeviceInput!): Device
    deleteDevice(id: String!):               Device
  }

  type schema {
    query:    Query
    mutation: Mutation
  }
`
