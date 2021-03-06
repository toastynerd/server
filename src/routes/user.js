const express = require('express');
const mustbe = require('mustbe').routeHelpers();

const User = require('../models/user');
const errorHelper = require('../errorHelper');

const router = new express.Router();

router.get('/', (req, res) => {
  User.find({})
    .select('-password')
    .then((users) => {
      res.json(users);
    })
    .catch(errorHelper(res, 500));
});

router.get('/:id', (req, res) => {
  User.findOne({ _id: req.params.id })
    .select('-password')
    .then((user) => {
      if (!user) {
        return errorHelper(res, 404)(new Error('User not found'));
      }
      return res.json(user);
    })
    .catch((err) => {
      /* istanbul ignore else */
      if (err.name === 'CastError') {
        return errorHelper(res, 404)(err);
      }
      /* istanbul ignore next */
      return errorHelper(res, 500)(err);
    });
});

router.post('/', (req, res) => {
  const user = new User(req.body);
  user.save()
    .then((newUser) => {
      const newerUser = newUser.toObject();
      //you should probably do this as `delete newerUser.password` setting things to
      //undefined is generally seen as an antipattern since it bypasses garbage collection
      newerUser.password = undefined; // eslint-disable-line no-param-reassign
      newerUser.token = newUser.getToken();
      res.json(newerUser);
    })
    .catch((err) => {
      /* istanbul ignore else */
      if (err.name === 'MongoError' && err.code === 11000) {
        return errorHelper(res, 400, 'Duplicate key')(err);
      }
      /* istanbul ignore next */
      return errorHelper(res, 500)(err);
    });
});

router.put('/:id', mustbe.authorized('user'), (req, res) => {
  User.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
    .then((updatedUser) => {
      updatedUser.password = undefined; // eslint-disable-line no-param-reassign
      return res.json(updatedUser);
    })
    .catch(errorHelper(res, 500));
});

router.delete('/:id', mustbe.authorized('user'), (req, res) => {
  User.remove({ _id: req.params.id })
    .then((deleteUser) => res.json(deleteUser))
    .catch(errorHelper(res, 500));
});

module.exports = router;

