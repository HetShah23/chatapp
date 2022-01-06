const chatForm = document.getElementById('chat-form')
const friendName = document.getElementById('friend-name')
const chatMessages = document.querySelector('.chat-messages')

// Get username and room from URL
const { username, friends } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
})

friendName.innerHTML = friends

const socket = io()

// Join chatroom
socket.emit('joinPersonalRoom', { username, friends })

// Message from server
socket.on('message', (message) => {
  outputMessage(message)

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight
})

// Message submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault()

  // Get message text
  let msg = e.target.elements.msg.value

  msg = msg.trim()

  if (!msg) {
    return false
  }

  // Emit message to server
  socket.emit('chatMessage', msg)

  // Clear input
  e.target.elements.msg.value = ''
  e.target.elements.msg.focus()
})

socket.on('previousChats', msgs => {
  msgs.forEach(msg => {
    const div = document.createElement('div')
    div.classList.add('message')
    const p = document.createElement('p')
    p.classList.add('meta')
    p.innerText = msg.username
    p.innerHTML += `<span style="margin-left: 5px;" >${msg.time}</span>`
    div.appendChild(p)
    const para = document.createElement('p')
    para.classList.add('text')
    para.innerText = msg.msg
    div.appendChild(para)
    document.querySelector('.chat-messages').appendChild(div)
  })
})

// Output message to DOM
function outputMessage(message) {
  if(message.username === 'ChatCord Bot'){
    const div = document.createElement('div')
    div.classList.add('sys-message')
    const p = document.createElement('p')
    const para = document.createElement('p')
    para.classList.add('text')
    para.innerText = message.text
    div.appendChild(para)
    document.querySelector('.chat-messages').appendChild(div)
  } else{
    const div = document.createElement('div')
    div.classList.add('message')
    const p = document.createElement('p')
    p.classList.add('meta')
    p.innerText = message.username;
    p.innerHTML += `<span style="margin-left: 5px;" >${message.time}</span>`
    div.appendChild(p)
    const para = document.createElement('p')
    para.classList.add('text')
    para.innerText = message.text
    div.appendChild(para)
    document.querySelector('.chat-messages').appendChild(div)
  }
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = ''
  users.forEach((user) => {
    const li = document.createElement('li')
    li.innerText = user.username
    userList.appendChild(li)
  })
}

//Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('Are you sure you want to leave the chatroom?')
  if (leaveRoom) {
    window.location = '../index.html'
  } else {
  }
})
