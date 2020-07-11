const express = require('express');
//requiring path and fs modules
const path = require('path');
const fs = require('fs');

//joining path of directory 
const directoryModels = path.join(__dirname, 'models');

var app = express();

//setting middleware
app.use(express.static(__dirname)); //Serves resources from public folder

// Get all files in directory
app.get("/textures/:model", function(req, res) {
    let modelDirectory = directoryModels + '/' + req.params.model;
    let textures = []
        //passsing directoryPath and callback function
    fs.readdir(modelDirectory, function(err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //Include only textures files
        files.forEach(function(file) {
            if (file.includes(".webp")) {
                textures.push(file.replace(".webp", ""));
            }
        });
        res.send(JSON.stringify(textures));
    });
});

var server = app.listen(8000);