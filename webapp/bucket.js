
const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')



const s3 = new aws.S3()
 
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'kratika',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: "Testing"});
    },
    key: function (req, file, cb) {
      cb(null, "folder/"+file.originalname)
    }
  })
})
 
    // const params = {
    //     Bucket: 'kratika',
    //     Key: function (req, file, cb){
    //       cb(null, file.originalname)
    //     }
    // };

    // s3.putObject(params, function (perr, pres) {
    //     if (perr) {
    //         console.log("Error uploading data: ", perr);
    //     } else {
    //         console.log("Successfully uploaded data to myBucket/myKey");
    //     }
    // });
module.exports = upload;