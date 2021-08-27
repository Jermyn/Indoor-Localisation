var Promise, battery, exec, execAsync, hciconfig, ifconfig, iproute, iwconfig, version;

Promise = require('bluebird');

exec = require('child_process').exec;

execAsync = function(command) {
  return new Promise(function(resolve, reject) {
    return exec(command, function(err, stdout, stderr) {
      if (err) {
        return resolve(null);
      } else {
        return resolve(stdout);
      }
    });
  });
};

hciconfig = function() {
  return execAsync(`hciconfig hci0`);
};

// version = function() {
//   return execAsync(`cd /home/pi/node_client && git rev-parse HEAD`);
// };

address = function() {
  return execAsync(`cat /sys/class/net/wlan0/address`)
};

// battery = function() {
//   return execAsync(`battery-voltage`);
// };

ifconfig = function() {
  return execAsync(`ifconfig wlan0`);
};

iwconfig = function() {
  return execAsync(`iwconfig wlan0`);
};

iproute = function() {
  return execAsync(`ip route`);
};

ipaddress = function() {
  return execAsync(`hostname -I`);
};

host = function() {
  return execAsync(`hostname -s`)
}

module.exports = {
  getCurrentState: function() {
    return Promise.all([address(), hciconfig(), ifconfig(), iwconfig(), iproute(), ipaddress(), host()]).then(function(xs) {
      return {
        // version: xs[0],
        address: xs[0],
        // battery: xs[1],
        hciconfig: xs[1],
        ifconfig: xs[2],
        iwconfig: xs[3],
        iproute: xs[4],
        ip: xs[5],
        host: xs[6]
      };
    });
  }
};
