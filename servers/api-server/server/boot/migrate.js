'use strict';

module.exports = function(server) {
  var ds = server.dataSources.postgresql
  var lbTables = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role', 'Map', 'Beacon', 'Anchor', 'Gatt', 'Device'];
  // ds.autoupdate(lbTables, function(err, result) {
  //   console.log(err ? err : 'autoupdate ok ...')
  // });

  // ds.automigrate(lbTables, function(err, result) {
  //   console.log(err ? err : 'automigrate ok ...')
  // });

};