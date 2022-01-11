const path = require('path')
const cors = require('cors')
const http = require('http')
const passport = require('passport')
const express = require('express')
const socketio = require('socket.io')
const mongo = require('mongodb').MongoClient
const mongoose = require('mongoose')
const socketConnection = require('./socketConnection')
const dbConfig = require('./config/database')

//CONNECTING TO DB
mongoose.connect(dbConfig.mongoURI)

//ON CONNECTION
mongoose.connection.on('connected', () => {
    console.log('Mongoose Connected!')
})
//CONNECTION ERROR
mongoose.connection.on('error', (err) => {
    console.log('ERROR IN CONNECTION TO MONGOOSE : \n' + err)
})

const app = express()
const server = http.createServer(app)
const io = socketio(server)

//CORS MIDDLEWARE
app.use(cors())

//BODY PARSER MIDDLEWARE
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))


//Impoting Routes
const userRoute = require('./routes/user')

//Running Routes
app.use('/user', userRoute)

// socket.io connection with mongodb 
mongo.connect('mongodb://127.0.0.1', function(dbError, client){

  if(dbError){
    throw dbError
  }

  console.log('MongoDB connected!')

  var db = client.db('chatApp')

  const onSocketConnection = socket => {
    socketConnection(io, socket, db)
  }
  
  io.on("connection", onSocketConnection)
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Server running on port ${PORT} \nhttp://localhost:3000/`))
