//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://guy-admin:test123@cluster0-pf43y.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Homework"
});

const item2 = new Item({
  name: "Bathroom"
});

const item3 = new Item({
  name: "Hair"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/:route", function(req, res) {
  const routeCapitalized = _.capitalize(req.params.route);
  List.findOne({ name: routeCapitalized }, function(err, foundList) {
    console.log(foundList);
    if (!foundList) {
      console.log("Does not exists!");
      const list = new List({
        name: routeCapitalized,
        items: []
      });
      list.save();
      res.redirect("/" + list.name);
    } else {
      console.log("Already exists.");
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items
      });
    }
  });
});

app.post("/", function(req, res) {
  const item = new Item({
    name: req.body.newItem
  });
  if (req.body.list === "Today") {
    //different saving method to the one  below, because we handle
    //the "primary" page differently then other lists.
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: req.body.list }, function(err, foundList) {
      foundList.items.push(item);
      //saved the route list(with the items that we pushed) in the Lists db.
      foundList.save();
      res.redirect("/" + req.body.list);
    });
  }
});

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/delete", function(req, res) {
  console.log(req.body.req);
  if (req.body.listName === "Today") {
    Item.findOneAndDelete({ _id: req.body.checkedItem }, function(err, res) {
      if (!err) {
        console.log("Successfully deleted checked item.");
      }
    });
    res.redirect("/");
  } else {
    //delete request is from custom list
    List.findOneAndUpdate(
      { name: req.body.listName },
      { $pull: { items: { _id: req.body.checkedItem } } },
      function(err, foundList) {
        if (!err) {
          res.redirect("/" + req.body.listName);
        }
      }
    );
  }
  Item.findOneAndDelete({ _id: req.body.checkedItem }, function(err, res) {
    if (err) {
      console.log("Fail");
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
