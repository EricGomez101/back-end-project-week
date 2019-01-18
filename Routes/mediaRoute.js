require('dotenv').config()
const router = require('express').Router();
const Note = require('../Models/Note');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const MEDIA = `${__dirname}/../Media`;
const aws = require('aws-sdk');
aws.config.update({
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
});
const s3 = new aws.S3();

const decodeBase64Image = (dataString) => {
  const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};
  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }
  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');
  return response;
}

router.route('/images/:image')
  .get((req, res) => {
    const { image, id } = req.params;
    const params = {
      Bucket: 'notesphotostorage',
      Key: image,
    }
    s3.getObject(params, (err, image) => {
      if (err) {
        res.status(404).json({'error': 'no image found'});
      } else {
        res.set('Content-Type', 'image/jpg').send(image.Body);
      }
    });
  })

router.route('/images/:id')
  .put((req, res) => {
    const { id } = req.params;
    let { image } = req.body;
    image = decodeBase64Image(image);
    const EXT = image.type.match(/image\/(.+)/)[1];
    const NAME = `${uuidv4()}.${EXT}`;
    const params = {
      Body: image.data,
      Bucket: 'notesphotostorage',
      Key: NAME
    }
    s3.putObject(params, (err, data) => {
      if (err) {
        console.log("Error", err);
      } else {
        Note.findById(id, (err, note) => {
          if (err) console.log("Error", err);
          if (note.image !== '') {
            const params = {
              Bucket: "notesphotostorage",
              Key: note.image.name
            };
            s3.deleteObject(params, function(err, data) {
              if (err) console.log("Delete Object ERROR", err);
            });
          }
          note.image = {
            "name": NAME,
            "type": EXT,
          };
          note.save();
          return res.status(200).json(note);
        })
      }
    })
  })
  .delete((req, res) => {
    const {id} = req.params;
    Note.findById(id, (err, note) => {
      if(err) return res.status(500).json(err);
      if (note.image.name !== '') {
        const params = {Bucket: 'notesphotostorage', Key: note.image.name};
        s3.deleteObject(params, (err, data) => {
          if (err) console.log(err);
          else {
            note.image = '';
            note.save();
            res.json(note);
          }
        })
      }
    })
  })
module.exports = router;
