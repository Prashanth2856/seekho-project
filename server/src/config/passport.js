require("dotenv").config();
const passport = require('passport');
const {v4: uuidV4} = require('uuid');
const { newToken } = require("../controllers/auth.controller");

var GoogleStrategy = require('passport-google-oauth2').Strategy;

const User = require('../models/user.model');
const UserBookList = require('../models/userBookList.model');
const ReadingList = require('../models/readingList.model');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback",
    userProfileURL: "https://**www**.googleapis.com/oauth2/v3/userinfo",
    passReqToCallback: true
  },
  
  async function(request, accessToken, refreshToken, profile, done) {
    const email = profile?._json?.email;

    let user;
    let userBookList;
    let readingList;
    try {
        user = await User.findOne({ email }).lean().exec();

        if (!user) {
            user = await User.create({
                email: email,
                password: uuidV4(),
                role: 'user'
            })

            const temp = {
              user: user['_id'],
              book: [],
              academic: []
          }
            userBookList = await UserBookList.create(temp);
            readingList = await ReadingList.create(temp);
        }

        userBookList = await UserBookList.findOne({user : user._id});
        readingList = await ReadingList.findOne({user : user._id});

        const token = newToken(user);

        user = {
          token: token, 
          userBookList: userBookList._id, 
          readingList: readingList._id
        }
        return done(null, user);
    } catch (err) {
        console.log("error:", err);
    }
  }
));

module.exports = passport;