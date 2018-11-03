var express = require('express');
var socket = require('socket.io');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// App setup
var app = express();
var server = app.listen(4000, function(){
    console.log('Listening to request on port 4000');
});


mongoose.connect("mongodb://localhost:27017/chatdb", { useNewUrlParser: true });


mongoose.connection.once('open', function(){
    console.log('Connected to Database..');
}).on('error',function(error){
    console.log('Connection error',error);
});


// Static files
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

const chatSchema = new mongoose.Schema({
  name: String,
  message: String
});

const Chat = mongoose.model('chat', chatSchema);

app.get('/', (req, res) => {
  Chat.find({}).then(messages => {
    res.render('index', {messages});
  }).catch(err => console.error(err));
});

//Socket setup
var io = socket(server);

io.on('connection',function(socket){
    console.log('made socket connection', socket.id);

    socket.on('chat', function(data){
      Chat.create({name: data.handle, message: data.message}).then(() => {
        io.sockets.emit('chat', data); // return data
    }).catch(function(err){
      throw err;
    } );
  });

    socket.on('typing', function(data){
        socket.broadcast.emit('typing', data);
    });
    // Handle clear
    socket.on('clear', function(data){
      // Remove all chats from collection
      Chat.remove({}).then( function(){
        io.sockets.emit('clear', data);       
      });
  });
});

