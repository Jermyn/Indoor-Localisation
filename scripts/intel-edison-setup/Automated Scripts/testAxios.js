var axios = require ('axios')
var graphqlUrl = "http://137.132.165.139:3000/graphql"
// var Promise = require ('bluebird')
var anchorid = ""
request = function ({query}) {
    return axios({
        method: 'post',
        url: `${graphqlUrl}`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({query})
    });
};

var query;
anchor = "b827eb2b96bc"
query = `query { anchor (id: "${anchor}") { device { id } } }`
request({query}).then(function ({data}) { this.getAnchorid(data)
})

getAnchorid = function(data) {
  return (data.data.anchor.device.id)
}