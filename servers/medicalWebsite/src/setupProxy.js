const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(proxy('/api',
    {
      target: 'https://manager.gimbal.com/api/beacons',
      changeOrigin: true,
      logLevel: 'debug',
      auth: 'Token token=05d02ede5b69b4edcc4f7edb97de9103',
      headers: {

        'Authorization': 'Token token=05d02ede5b69b4edcc4f7edb97de9103',
      },
      onProxyRes: onProxyRes = (proxyRes, req, res) => {
        if (proxyRes.headers['authorization']){
              proxyRes.headers['authorization'] = req.headers['authorization'];
          }

       }
    }
  ));
};
