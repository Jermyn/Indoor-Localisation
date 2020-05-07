Promise   = require 'bluebird'
exec      = require('child_process').exec

execAsync = (command) ->
  return new Promise (resolve, reject) ->
    exec command, (err, stdout, stderr) ->
      if err then resolve(null) else resolve(stdout)

hciconfig = ->
  execAsync('''
    hciconfig hci0
  ''')

version = ->
  execAsync('''
    cd /home/root/node_client && git rev-parse HEAD
  ''')

battery = ->
  execAsync('''
    battery-voltage
  ''')

ifconfig = ->
  execAsync('''
    ifconfig wlan0
  ''')

iwconfig = ->
  execAsync('''
    iwconfig wlan0
  ''')

iproute = ->
  execAsync('''
    ip route
  ''')

module.exports =

  getCurrentState: ->
    Promise.all([
      version(),
      battery(),
      hciconfig(),
      ifconfig(),
      iwconfig(),
      iproute()
    ])
    .then (xs) ->
      return {
        version:    xs[0]
        battery:    xs[1]
        hciconfig:  xs[2]
        ifconfig:   xs[3]
        iwconfig:   xs[4]
        iproute:    xs[5]
      }