const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const path = require('path');
const fs = require('fs');
require('log-timestamp');

const app = express();

// Use BodyParser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));

// Setup Express session
app.use(session({
    secret: 'awesomesecret',
    resave: false,
    saveUninitialized: false
}));

// Middleware
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    {
       usernameField: 'userID',
       passwordField: 'password'
    },
    function(username, password, done) {
	console.log("Server userID: ", username, " password: ", password);
        if (username === "admin" && password === "SecretPassw0rd") {
            return done(null, { id: 1, username: "admin" });
        } else {
            return done(null, false, { message: 'Incorrect credentials.' });
        }
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(null, { id: 1, username: "admin" });
});

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/' }),
    function(req, res) {
	console.log("auth was successful");
        res.redirect('/download.html');  // Redirect to the download page if authentication succeeds
    }
);

app.get('/download.html', function(req, res) {
    console.log("Get /download request");
    const filePath = path.join(__dirname, 'download.html');
    if (req.isAuthenticated()) {
	console.log("auth success");
	fs.readFile(filePath, 'utf8', (err, content) => {
          if (err) {
              res.status(500).send('Unable to read the file');
              return;
           }
           res.send(content);
        });
    } else {
	console.log("Not authenticated");
        res.redirect('/');  // If not authenticated, redirect to the main page
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
