const router = require('express').Router();
const Note = require('../Models/Note');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const MEDIA = `${__dirname}/../Media`;

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
    fs.readFile(`${MEDIA}/Images/${image}`, (err, file) => {
      if (err) {
        res.status(404).json({'error': 'no image found'});
      } else {
        res.set('Content-Type', 'image/jpg').send(file);
      }
    })
  })
router.route('/images/:id')
  .put((req, res) => {
    const { id } = req.params;
    let { image } = req.body;
    image = decodeBase64Image(image);
    const EXT = image.type.match(/image\/(.+)/)[1];
    const NAME = `${uuidv4()}.${EXT}`;
    fs.writeFile(`${MEDIA}/Images/${NAME}`, image.data, function(err) {
      if (err) console.log(err);
    });
    Note.findById(id, (err, note) => {
      if (err) console.log(err);
      if (note.image.name !== '') {
        fs.unlink(`${MEDIA}/Images/${note.image.name}`, (err) => {
          if (err) console.log(err);
        });
      }
      note.image = {
        "name": NAME,
        "type": EXT,
      };
      note.save();
      return res.status(200).json(note);
    })
  })
  .delete((req, res) => {
    const {id} = req.params;
    Note.findById(id, (err, note) => {
      if(err) return res.status(500).json(err);
      if (note.image.name !== '') {
        fs.unlink(`${MEDIA}/Images/${note.image.name}`, (err) => {
          if (err) console.log("File not found.");
          note.image = '';
          note.save();
          res.status(200).json(note);
        });
      }
    })
  })
module.exports = router;
