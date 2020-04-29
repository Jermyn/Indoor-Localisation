pg        = require("pg")

connectServer = ->
  pool = new pg.Pool({
  user: 'macpro',
  host: '127.0.0.1',
  database: 'indoor-localization-2.0',
  # password: 123,
  port: 5432});
  pool.query("SELECT * FROM beacon", (err, res) => if err==undefined then console.log "Successfully Connected" else console.log err)
  # pool.end()
  return pool

inputBeacon = (pool, id, deviceid, measuredpower) ->
  pool.query("INSERT INTO beacon(id, measuredpower, deviceid) VALUES('#{id}', '#{measuredpower}', '#{deviceid}')", (err, res) => if err==undefined then console.log "Successfully Inserted" else console.log err)
  pool.query("INSERT INTO device(id, type, location) VALUES('#{deviceid}', 'mobile', '[]')", (err, res) => if err==undefined then console.log "Successfully Inserted" else console.log err)
  
findBeaconByDevice = (pool, type) ->
  deviceType = []
  index = 0
  return new Promise (resolve, reject) ->
    pool.query("SELECT deviceid FROM gatt", (err, res) => 
      if err
        console.log "Error finding Beacon"
        reject(0)
      else
        console.log res
        while (index < res.rows.length)
          if res.rows[index].deviceid.indexOf(type) !=-1
            deviceType.push(parseInt(res.rows[index].deviceid.match(/\d+/)[0]))
          index = index + 1
        resolve(deviceType))


inputGatt = (pool, id, profile, deviceid, measuredpower) ->
  if profile == "imu"
    characteristics = '{"fff0": {"fff1": {"notify": true}}}'
  else if profile == "ecg"
    characteristics = '{
                "fff0": {
                  "fff4": {"notify": true},
                  "fff3": {
                    "write": {
                      "data": [6],
                      "timer": [100]
                    }
                  }
                }
              }'
  else if profile == "hr"
    characteristics = '{"180d": {"2a37": {"notify": true}}}'
  pool.query("INSERT INTO gatt(id, profile, connect, deviceid) VALUES('#{id}', '#{characteristics}', false, '#{deviceid}')", (err, res) => if err==undefined then console.log "Successfully Inserted" else console.log err)
  pool.query("INSERT INTO device(id, type, location) VALUES('#{deviceid}', 'mobile', '[]')", (err, res) => if err==undefined then console.log "Successfully Inserted" else console.log err)
  pool.query("INSERT INTO beacon(id, measuredpower, deviceid) VALUES('#{id}', '#{measuredpower}', '#{deviceid}')", (err, res) => if err==undefined then console.log "Successfully Inserted" else console.log err)
  

deleteGatt = (pool, id) ->
  pool.query("DELETE FROM gatt WHERE id='#{id}'", (err) => if err==undefined then console.log "Successfully deleted" else console.log err)
  

findBeacon = (pool, id) ->
  return new Promise (resolve, reject) ->
    pool.query("SELECT id FROM beacon WHERE id='#{id}'", (err, res) => 
      if err
        console.log "Error finding Beacon"
        reject(0)
      else
        # console.log res
        if res.rows[0]?.id == id
          console.log "Found Beacon #{id}"
          resolve(res.rows[0].id == id)
        else
          console.log "Beacon #{id} doesn't exist"
          resolve(false))


  

pool = connectServer()
findBeacon(pool, 'cd201055b4ea').then((beaconIsFound) =>
  if !beaconIsFound
    findBeaconByDevice(pool, 'hr').then((beaconArray) => 
     indexArr=0
     while (indexArr < 5)
        if beaconArray.indexOf(indexArr) == -1
          inputGatt(pool, 'cd201055b4ea', 'hr', 'hr'+String(indexArr),-62)
          break
        indexArr = indexArr + 1))
  
# inputBeacon(pool, '3:16', 'b16', -63)
# inputGatt(pool, '123', 'imu', -62)
# deleteGatt(pool, 'imu72')
# findBeacon(pool, '5c313e8c211').then((beaconIsFound) => 
#   if !beaconIsFound
#     inputGatt(pool, '1234', 'imu', 'imu72', -62))
# pool.end()

