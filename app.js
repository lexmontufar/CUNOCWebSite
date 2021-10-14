const express = require('express');
const app = express();

//app.use(express.static(__dirname + '/build'));
app.use('/build', express.static(__dirname + '/build'));

app.get('/', function (req, res) {
    res.sendFile('./index.html', {
        root: __dirname
    });
});

// Server Listening
app.listen(3000, function () {
    console.log('App listening on port 3000!');
});
