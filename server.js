// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Initialize Express
var app = express();
// Require handlebars
var exphbs = require('express-handlebars');
  // Configure app with handlebars
  module.exports = function(app) {
    var hbs = exphbs.create({
      defaultLayout: 'app',
      helpers: {
        section: function(name, options) {
          if (!this._sections) this._sections = {}
          this._sections[name] = options.fn(this)
          return null
        }
      }
    })

  app.engine('handlebars', hbs.engine)
  app.set('view engine', 'handlebars')
}

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Use body parser with our app

app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/scrapingNewsArticles");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Routes
// ======

app.get("/scrape", function(req, res) {
  request('http://www.theonion.com/section/entertainment/', function (error, response, html){
      var $ = cheerio.load(html);
      $("article.summary").each(function(i, element) {
          var result = {};
          // this is the link:
          result.link = $(this).children('a').attr('href');
          // this is the image:
          result.image = $(this).children('div.info').children('figure.thumb').children().children().children().children().attr('src');
          // this is the title:
          result.title = $(this).children('div.info').children('div.inner').children('header').children().children().attr('title');
          console.log(result);
          var entry = new Article(result);
          entry.save(function(err, doc) {
              if (err) {
                  console.log(err);
              } else{
              console.log(doc);
              }
          })
      })
  })//request
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});



app.use('/', home)

// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});