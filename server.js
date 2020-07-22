var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var port = process.env.PORT || 9999;

const dev = process.env.NODE_ENV !== 'production';
const next = require('next');
const client = next({ dev });
const handle = client.getRequestHandler();


var router = express.Router();
var multer  = require('multer');
var AWS = require('aws-sdk');
var storage = multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, '');
    }
});
var multipleUpload = multer({ storage: storage }).array('file');

const BUCKET_NAME = 'paras-media';
const IAM_USER_KEY = process.env.IAM_USER_KEY;
const IAM_USER_SECRET = process.env.IAM_USER_SECRET;

var s3 = new AWS.S3({
  accessKeyId: IAM_USER_KEY,
  secretAccessKey: IAM_USER_SECRET,
});

router.post('/upload', multipleUpload, function (req, res) {
  const files = req.files;
  
  var params = {
    Bucket: BUCKET_NAME,
    Key: files[0].originalname,
    Body: files[0].buffer,
    ACL: 'public-read'
  };

  s3.putObject(params, function (perr, pres) {
    if (perr) {
      console.log("Error uploading data: ", perr);
      res.status(400).json({
        error: perr
      })
    } else {
      res.json({
        url: `https://${BUCKET_NAME}.s3-ap-southeast-1.amazonaws.com/${files[0].originalname}`
      })
    }
  });
});

client.prepare().then(() => {
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(cors());
  app.use('/api', router);

  app.get('/', (req, res) => {
    return client.render(req, res, '/')
  })

  app.get('*', (req, res) => {
    return handle(req, res);
  });

  // Start the server
  app.listen(port,function(err){
    if(err){
    console.log(" DB Error: ",err);
  }else{
    console.log('Port connected',port);
  }
  });
})