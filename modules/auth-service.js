const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('dotenv').config({ path: './test.env' });
const bcrypt = require('bcryptjs');
const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User;

function initialize() {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGODB);
    db.on('error', (err) => {
      reject(err);
    });
    db.once('open', () => {
      User = db.model('users', userSchema);
      resolve();
    });
  });
}

function registerUser(userData) {
  return new Promise((resolve, reject) => {
    // Validate required fields
    if (!userData.userName || !userData.password || !userData.email) {
      reject("User Name, Password, and Email are required fields.");
      return;
    }

    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

    // Hash the password before saving
    bcrypt
      .hash(userData.password, 10) // Hash the user-entered password with a salt factor of 10
      .then((hash) => {
        let newUser = new User({
          userName: userData.userName,
          password: hash, // Save the hashed password instead of the plain text password
          email: userData.email,
          loginHistory: [],
        });

        newUser
          .save()
          .then(() => resolve())
          .catch((err) => {
            if (err.code === 11000) {
              reject("User Name already taken");
            } else {
              reject(`There was an error creating the user: ${err}`);
            }
          });
      })
      .catch((err) => {
        reject("There was an error encrypting the password"); // Reject if password hashing fails
      });
  });
}

function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then((user) => {
        if (!user) {
          reject(`Unable to find user: ${userData.userName}`);
        } else {
          // Compare hashed password with the provided password
          bcrypt
            .compare(userData.password, user.password) // Compare the hashed password with the plain text password
            .then((result) => {
              if (!result) {
                reject(`Incorrect Password for user: ${userData.userName}`); // Reject if passwords do not match
              } else {
                // Update login history
                user.loginHistory.unshift({
                  dateTime: new Date(),
                  userAgent: userData.userAgent,
                });

                User.updateOne(
                  { userName: user.userName },
                  { $set: { loginHistory: user.loginHistory } }
                )
                  .then(() => resolve(user))
                  .catch((err) => {
                    reject(`There was an error verifying the user: ${err}`);
                  });
              }
            })
            .catch((err) => {
              reject(`There was an error verifying the password: ${err}`); // Reject if password comparison fails
            });
        }
      })
      .catch((err) => {
        reject(`Unable to find user: ${userData.userName}`);
      });
  });
}

module.exports = { initialize, registerUser, checkUser };
