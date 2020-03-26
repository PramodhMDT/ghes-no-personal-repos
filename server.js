var http = require('http')
var createHandler = require('github-webhook-handler')
require('dotenv').config()

var handler = createHandler({ path: '/webhook', secret: (process.env.SHARED_SECRET) })

var org = process.env.GHE_ORG


http.createServer(function (req, res) {
  handler(req, res, function (err) {
    console.log(err)
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(3000)

handler.on('error', function (err) {
  console.error('Error:', err.message)
})

handler.on('repository', function (event) {
  if (event.payload.action === 'created') {
    repo = event.payload.repository.full_name
    creator = event.payload.sender.login
    console.log('Received webhook for new repository ' + repo + ' created by ' + creator)
    //addUsertoOrg(user)
  }
})

function addUsertoOrg (user) {
  var data = ''
  const https = require('https')
  data = JSON.stringify({
    role: 'member'
  })


  const options = {
    hostname: (process.env.GHE_HOST),
    port: 443,
    path: '/api/v3/orgs/' + org + '/memberships/' + user,
    method: 'PUT',
    headers: {
      Authorization: 'token ' + process.env.GHE_TOKEN,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }
  // let body = []
  const req = https.request(options, (res) => {
    if (res.statusCode !== 200) {
      console.log('Status code: ' + res.statusCode)
      console.log('Adding ' + user + ' to ' + org + 'Failed')
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk)
      })
    } else {
      console.log('Added ' + user + ' to ' + org)
    }
  })

  req.on('error', (error) => {
    console.error(error)
  })

  req.write(data)
  req.end()
}
