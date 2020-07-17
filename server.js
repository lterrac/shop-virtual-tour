const express = require('express');
//requiring path and fs modules
const path = require('path');
const fs = require('fs');

//joining path of directory 
const directoryModels = path.join(__dirname, 'models');

var app = express();

//setting middleware
app.use(express.static(__dirname)); //Serves resources from public folder

/**
 * Set the server port
 */
let serverPort = process.env.PORT || 8000;
// Get all files in directory
app.get("/textures/:model/", function(req, res) {
    let modelDirectory = directoryModels + '/' + req.params.model + "/textures";
    let textures = []

    try {
        if (fs.existsSync(modelDirectory)) {
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
        } else {
            res.send(JSON.stringify(textures));
        }
    } catch (e) {
        console.log("An error occurred.")
    }
});

app.set("port", serverPort);

/* Start the server on port 8000 */
app.listen(serverPort, function() {
    console.log(`Your app is ready at port ${serverPort}`);
});