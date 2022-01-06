const path = require('path')
const http = require('http')
const express = require('express')
const mongo = require('mongodb').MongoClient
const socketio = require('socket.io')
const uniqid = require('uniqid')
const formatMessage = require('./utils/messages')
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'ChatCord Bot'

mongo.connect('mongodb://127.0.0.1', function(dbError, client){
  if(dbError){
    throw dbError
  }

  console.log('MongoDB connected!')
  
  // Run when client connects
  io.on('connection', socket => {
    var db = client.db('chatApp')
    let usersDB = db.collection('users')
    let roomsDB = db.collection('rooms')

    // create new room
    socket.on('createNewRoom', newRoomName => {
      console.log('1')
    })
    
    socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room)

      socket.join(user.room)

      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'))

      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          'message',
          formatMessage(botName, `${user.username} has joined the chat`)
        )

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      })
    })

    // user login
    socket.on('loggedInUsername', loggedInUsername => {
      const newUser = {
        username: loggedInUsername
      }
      
      // added user to db
      usersDB.findOne({username: loggedInUsername}, async (errorFind, userFound) => {
        if(errorFind) throw errorFind
        
        var usersList = await usersDB.find({},{ projection: { '_id': 0, 'username': 1  }}).toArray()

        if(!userFound){
          usersDB.insertOne(newUser)
        }
        
        socket.emit('friendsList', usersList)
      })
    })

    // Join Personal Room
    socket.on('joinPersonalRoom', personalRoomData => {

      var usernameArr = [personalRoomData.username, personalRoomData.friends]
      usernameArr = usernameArr.sort()
      const newRoom = {
        type: 'private',
        username1 : usernameArr[0],
        username2 : usernameArr[1],
        roomid : uniqid(),
        chats : []
      }
      
      roomsDB.findOne({ $and : [{username1: newRoom.username1}, {username2: newRoom.username2}]}, (errRoom, room) => {
        if(errRoom) throw errRoom
        
        if(!room){
          roomsDB.insertOne(newRoom)
          const user = userJoin(socket.id, personalRoomData.username, newRoom.roomid)

          socket.join(user.room)
          socket.emit('message', formatMessage(botName, 'Start Chatting!'))
        } else{
          const user = userJoin(socket.id, personalRoomData.username, room.roomid)
          socket.join(user.room)

          if(room.chats.length === 0){
            socket.emit('message', formatMessage(botName, 'Start Chatting!'))
          } else{
            socket.emit('previousChats', room.chats)
          }
        }
      })
    })

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
      const user = getCurrentUser(socket.id)
      const formattedMsg = formatMessage(user.username, msg)
      
      // adding msg to db
      roomsDB.updateOne(
        {roomid: user.room}, 
        {
          $addToSet: {
            chats: {
              username: formattedMsg.username,
              msg: formattedMsg.text,
              time: formattedMsg.time
            }
          }
        }, 
        (errUpdate, statusUpdate) => {
        if(errUpdate) throw errUpdate
      })

      io.to(user.room).emit('message', formattedMsg)
    })

    // Runs when client disconnects
    socket.on('disconnect', () => {
      const user = userLeave(socket.id)

      if (user) {
        io.to(user.room).emit(
          'message',
          formatMessage(botName, `${user.username} has left the chat`)
        )

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        })
      }
    })
  })

})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Server running on port ${PORT} \nhttp://localhost:3000/`))
