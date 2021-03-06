const bodyParser = require('body-parser');
const express = require('express');

const Post = require('./post.js');

const STATUS_SERVER_ERROR = 500;
const STATUS_USER_ERROR = 422;

const server = express();
// to enable parsing of json bodies for post requests

server.use(bodyParser.json());

// TODO: write your route handlers here
server.get('/accepted-answer/:soID', (req, res) => {
  const { soID } = req.params;
  Post.findOne({ soID }, (err1, post) => {
    if (err1 || post === null) {
      res.status(STATUS_USER_ERROR).json(err1);
      return;
    }
    Post.findOne({ soID: post.acceptedAnswerID }, (err2, acceptedAnswer) => {
      if (err2 || acceptedAnswer === null) {
        res.status(STATUS_USER_ERROR).json(err2);
        return;
      }
      res.json(acceptedAnswer);
    });
  });
});

server.get('/top-answer/:soID', (req, res) => {
  const { soID } = req.params;
  Post.findOne({ soID }, (err1, post) => {
    if (err1 || post === null) {
      res.status(STATUS_USER_ERROR).json(err1);
      return;
    }
    Post.findOne({ soID: { $ne: post.acceptedAnswerID }, parentID: post.soID })
      .sort({ score: 'desc' })
      .exec((err2, sortedAnswers) => {
        if (err2 || sortedAnswers === null) {
          res.status(STATUS_USER_ERROR).json(err2);
          return;
        }
        res.json(sortedAnswers);
      });
  });
});

server.get('/popular-jquery-questions', (req, res) => {
  Post.find()
    .where({ tags: { $in: ['jquery'] } })
    .where({ $or: [{ score: { $gte: 5000 } }, { 'user.reputation': { $gte: 200000 } }] })
    .where({ parentID: null })
    .exec((err, posts) => {
      if (err || posts.length === 0) {
        res.status(STATUS_USER_ERROR).json(err);
        return;
      }
      res.json(posts);
    });
});

server.get('/npm-answers', (req, res) => {
  Post.find({ tags: { $in: ['npm'] } }, (err1, qPosts) => {
    if (err1 || qPosts.length === 0) {
      res.status(STATUS_USER_ERROR).json(err1);
      return;
    }

    const soIDArr = qPosts.map(post => post.soID);

    Post.find({ parentID: { $in: soIDArr } }, (err2, aPosts) => {
      if (err2 || aPosts.length === 0) {
        res.status(STATUS_USER_ERROR).json(err2);
        return;
      }
      res.json(aPosts);
    });
  });
});

module.exports = { server };
