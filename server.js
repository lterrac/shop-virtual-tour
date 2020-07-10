var express = require('express');
var app = express();

//setting middleware
app.use(express.static(__dirname)); //Serves resources from public folder

/**
 * Set the server port
 */
let serverPort = process.env.PORT || 8000;

app.set("port", serverPort);

initSqlDB();
initDb();

/* Start the server on port 8000 */
app.listen(serverPort, function() {
    console.log(`Your app is ready at port ${serverPort}`);
});