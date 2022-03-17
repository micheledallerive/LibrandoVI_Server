// `
const express = require('express')

const app = express()
const fs = require('fs')
const helmet = require('helmet')

const https = require('https')
const port = process.env.PORT || '3001'

const fileUpload = require('express-fileupload')

const utils = require('./utils')

app.use(fileUpload())
app.use(express.json())
app.use(helmet())

app.use((req,res,next)=>{
  let allowed = ["https://www.micheledallerive.ch", "https://micheledallerive.ch"];
  console.log("Request from: "+req.headers.origin);
  res.setHeader('Access-Control-Allow-Origin', ((allowed.includes(req.headers.origin))?req.headers.origin:""));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

const dbs = utils.loadDbs()

require('./routes/adozioni')(app, dbs)
require('./routes/routes')(app, dbs)

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/micheledallerive.ch/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/micheledallerive.ch/cert.pem')
}

https.createServer(options, app).listen(port)
