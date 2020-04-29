var bindActionCreators;

({ bindActionCreators } = require('redux'));

module.exports = function(dispatch) {
    return {
      actions: {
        types: bindActionCreators(require('./actionTypes'), dispatch),
        maps: bindActionCreators(require('./maps'), dispatch),
        devices: bindActionCreators(require('./devices'), dispatch)
      }
    };
  };