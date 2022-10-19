const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

module.exports = function (passport) {
    passport.use('user-local',
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            User.findOne({ email: email }).then(user => {
                if (!user) {
                    return done(null, false, { message: 'Email not registered' })
                }
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) {
                        throw err
                    }
                    if (isMatch) {
                        return done(null, user)
                    }
                    else {
                        return done(null, false, { message: 'Incorrect password' })
                    }
                })
            }).catch(err => console.log(err))
        })
    )

    passport.use('admin-local', new LocalStrategy({ usernameField: 'name' }, (name, password, done) => {
        User.findOne({ name: name }).then(user => {
            if (!user) {
                return done(null, false, { message: 'Nope' })
            }
            if (!user.admin) {
                return done(null, false, { message: 'Nein' })
            }
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    throw err
                }
                if (isMatch) {
                    return done(null, user)
                }
                else {
                    return done(null, false, { message: 'Niet' })
                }
            })
        }).catch(err => console.log(err))
    }))

    passport.serializeUser((user, done) => {
        done(null, user.id);
    })

    passport.deserializeUser((id, done) => {
        User.findById(id, function (err, user) {
            done(err, user);
        })
    })
}