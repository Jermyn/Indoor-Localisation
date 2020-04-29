'use strict';

module.exports = function(Map) {

  Map.image = (id, cb) => {
    Map.findById(id, (err, map) => {
      err ? cb(err) : map && map.image ? cb(null, map.image) : cb('image does not exist')
    })
  }

  Map.afterRemote('image', function(context) {
    var img = Buffer.from(context.result, 'base64')
    context.res.setHeader('Content-Type', 'image/png')
    context.res.setHeader('Content-Length', img.length)
    context.res.end(img)
  });

  Map.remoteMethod('image', {
    accepts:  {arg: 'id', type: 'string', required: true},
    http:     {path: '/:id/image', verb: 'get'},
    returns:  {type: 'string', root: true},
    description: 'Access base64 image field as image'
  })
  
};
