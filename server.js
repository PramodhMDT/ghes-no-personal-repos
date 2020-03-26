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
    console.log('Received webhook for new repository ' + repo_full_name + ' created by ' + creator)
    console.log(repo_full_name.split('/'))
    repo_name = repo_full_name.split('/')
    repo_owner = repo_name[0]
    repo = repo_name[1]
    if(repo_owner == creator) {
      console.log("delete the repo")
      getImpersonation(creator)
      console.log(impersonationToken)
    } else {
      console.log("doing nothing")
    }
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
      //deleteImpersonationToken()
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
  console.log('Deleting impersonation token for ' + creator)
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
        console.log('impersonationToken for ' + creator + ' deleted')
      }
    })

  })

  req.on('error', (error) => {
    console.error(error)
  })

  req.end()
}

function deleteRepository() {
  console.log('Deleting repo ' + repo_full_name)
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
      }
    })

  })

  req.on('error', (error) => {
    console.error(error)
  })

  req.end()
}
