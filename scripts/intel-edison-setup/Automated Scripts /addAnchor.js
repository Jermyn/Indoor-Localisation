noble = require('noble');
zmq = require('zmq');
config = require('./configs/config.json');
_ = require ('underscore')
Rx = require('rxjs/Rx')
exec = require('child_process').exec;
Promise = require('bluebird');
axios = require ('axios')
log = require('./log.js')

///////////////////////////////////////////////////////////////////////////////////////////////
// STATE
/////////////////////////////////////////////////////////////////////////////////////////////// 
var graphqlUrl = "http://137.132.165.139:3000/graphql"
var restUrl = "http://137.132.165.139:3000/api"
var env = {}
var syslog = {}
var poxid = {}
serviceUuid = '6e400001b5a3f393e0a9e50e24dcca9e';
characteristicUuid = '6e400003b5a3f393e0a9e50e24dcca9e';

updateSyslog$ = Rx.Observable.timer(1000);

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

request = function ({url}) {
    return axios({
        method: 'get',
        url: `${url}`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({query})
    });
};

updateSyslog = function() {
  return log.getCurrentState().then(function(res) {
    return syslog = res;
  }).catch(function(err) {
    console.log('error: cannot update syslog');
    return syslog = {};
  });
};

checkAnchorExists = function(anchorid) {
	return request({restUrl + "/"})
}

execAsync(`hciconfig hci0 reset`);
updateSyslog$.subscribe(function() {
  return updateSyslog();
});
let anchorid = syslog.address.replace(/:/g,'').replace(/\n/g, '')
let anchorExists = checkAnchorExists(anchorid)
