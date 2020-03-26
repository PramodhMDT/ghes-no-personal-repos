var http = require('http')
var createHandler = require('github-webhook-handler')
require('dotenv').config()

var handler = createHandler({ path: '/webhook', secret: (process.env.SHARED_SECRET) })

var impersonationToken = ''
var creator = ''
var repo_owner = ''
var repo = ''


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
    repo_full_name = event.payload.repository.full_name
    creator = event.payload.sender.login
    repo_name = repo_full_name.split('/')
    repo_owner = repo_name[0]
    repo = repo_name[1]
    if(repo_owner === creator) {
      console.log('Invalid new repository detected ' + repo_full_name + ' created by ' + creator)
      getImpersonation(creator)
    }
    }
})

function getImpersonation (creator) {  const https = require('https')
  const data = JSON.stringify({
    scopes: ['delete_repo']
  })

  const options = {
    hostname: (process.env.GHE_HOST),
    port: 443,
    path: '/api/v3/admin/users/' + creator + '/authorizations',
    method: 'POST',
    headers: {
      Authorization: 'token ' + (process.env.GHE_TOKEN),
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }
  let body = []
  const req = https.request(options, (res) => {
    res.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      if (res.statusCode == 201 || res.statusCode == 200 ) {
      impersonationToken = JSON.parse(body).token
      if (impersonationToken === null || impersonationToken === 'null' || impersonationToken.length < 1) {
        console.log('Creating impersonationToken failed for ' + creator)
      }
      deleteRepository()
    }
    })

  })

  req.on('error', (error) => {
    console.error(error)
  })

  req.write(data)
  req.end()
}

function deleteImpersonationToken () {
  const https = require('https')

  const options = {
    hostname: (process.env.GHE_HOST),
    port: 443,
    path: '/api/v3/admin/users/' + creator + '/authorizations',
    method: 'DELETE',
    headers: {
      Authorization: 'token ' + (process.env.GHE_TOKEN),
      'Content-Type': 'application/json'
    }
  }
  let body = []
  const req = https.request(options, (res) => {
    res.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      if (res.statusCode == 204) {
        console.log('ImpersonationToken for ' + creator + ' deleted')
      } else {
        console.log('Failed to delete ImpersonationToken for ' + creator)
      }
    })

  })

  req.on('error', (error) => {
    console.error(error)
  })

  req.end()
}

function deleteRepository() {
  const https = require('https')

  const options = {
    hostname: (process.env.GHE_HOST),
    port: 443,
    path: '/api/v3/repos/' + repo_full_name,
    method: 'DELETE',
    headers: {
      Authorization: 'token ' + impersonationToken,
      'Content-Type': 'application/json'
    }
  }
  let body = []
  const req = https.request(options, (res) => {
    res.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      if (res.statusCode == 204) {
        console.log('Repository ' + repo_full_name + ' deleted')
        deleteImpersonationToken()
      } else {
        console.log('Failed to delete repository ' + repo_full_name)
      }
    })

  })

  req.on('error', (error) => {
    console.error(error)
  })

  req.end()
}
