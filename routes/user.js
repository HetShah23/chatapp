const express = require('express')
const router = express.Router()
const uniqid = require('uniqid')
const UserModel = require('../models/userModel')

//Add new user
router.post('/register', async (req, res, next) => {

    let newData = new UserModel({
        userID: uniqid('user-'),
        name: req.body.name,
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        userProfileImg: req.body.userProfileImg,
        isConfirmed: false
    })

    UserModel.addNewUser(newData, (err, user, msg) => {
        if(err){
            res.json({success: false, msg: 'Failed to register user'})
        } else {
            if(!user){
                res.json({success: false, msg: msg})
            } else{
                res.json({success: true, msg: 'User registered'})
            }
        }
    })
})


//user login
router.post('/login', async (req, res, next) => {
    let userData = {
        userIdentifier: req.body.userIdentifier,
        password: req.body.password
    }

    UserModel.userLogin(userData, (err, user, msg) => {
        if(err){
            res.json({success: false, msg: 'Failed to login user'})
        } else {
            if(!user){
                res.json({success: false, msg: msg})
            } else{
                res.json({
                    success: true, 
                    msg: `${userData.userIdentifier} logged in.`, 
                    token: 'JWT ' + msg
                })
            }
        }
    })
})


module.exports = router