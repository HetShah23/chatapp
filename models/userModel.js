const mongoose = require('mongoose')
const database = require('../config/database')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

//Schema
const userSchema = mongoose.Schema({
    userID : {
        type: String,
        required: true
    },
    username : {
        type: String,
        required: true
    },
    name : {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true
    },
    password : {
        type: String,
        required: true
    },
    userProfileImg : {
        type: String,
        required: true
    },
    isConfirmed : {
        type: Boolean,
        required: true
    }
})

const UsersModel = module.exports = mongoose.model('users', userSchema)

//FINDING USERS BY ID
module.exports.getUserById = function(id, callback){
    UsersModel.findById(id, callback);
}

// ADDING NEW USER
module.exports.addNewUser = function(newDetails, callback){
    UsersModel.findOne({email: newDetails.email}, (error, user) => {
        if(error) throw error
        if(user){
            return callback(null, false, 'Email already exists')
        }else{
            UsersModel.findOne({username: newDetails.username}, (errorUsername, username) => {
                if(errorUsername) throw errorUsername
                if(username){
                    return callback(null, false, 'Username already exists')
                }else{
                    bcrypt.genSalt(10, (err, salt) => {
                        if(err) throw err
                        bcrypt.hash(newDetails.password, salt, (er, hash) => {
                            if(er) throw er
                            newDetails.password = hash
                            newDetails.save(callback)
                        })
                    })
                }
            })
        }
    })
}

// USER LOGIN
module.exports.userLogin = function(userDetails, callback){
    UsersModel.findOne(
        {
            $or: [
                {email: userDetails.userIdentifier}, 
                {username: userDetails.userIdentifier}
            ]
        }, 
        (error, user) => {
            if(error) throw error
            if(!user){
                return callback(null, false, 'User not found')
            } else{
                bcrypt.compare(userDetails.password, user.password, (err, isMatch) => {
                    if(err) throw err
                    if(isMatch){
                        const token = jwt.sign({ ...user.toJSON(), password: null }, database.secret, {
                            expiresIn: 86400  //1 Day timer - token is valid for one day (86400 seconds)
                        })

                        return callback(null, user, token)
                    }else{
                        return callback(null, false, 'Wrong password')
                    }
                })
            }
        }
    )
}

// COMPARE PASSWORD WITH BCRYPT
module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
        if(err) throw err
        callback(null, isMatch)
    })
}