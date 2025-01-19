import {NextFunction, Request, Response} from "express"

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import {models} from '../db'
import {ROLE} from "../utils/enums"
import {UserModel} from "../db/user";


const {
    User
} = models
exports.registerUser = async (_req: Request, res: Response, _next: NextFunction) => {
    console.log('User started registration process')

    if (_req.body.email == undefined)
        return res.status(400).json({message: 'Email address is required'})
    if (_req.body.password == undefined)
        return res.status(400).json({message: 'Password is required'})
    if (_req.body.role == undefined)
        return res.status(400).json({message: 'Role is required'})

    let roleString = (_req.body.role as string).toUpperCase() as keyof typeof ROLE
    let role = ROLE[roleString]

    if (role == undefined)
        return res.status(400).json({message: 'Proper role is required'})

    bcrypt.hash(_req.body.password, 10, async (err, hash) => {
        if (err) {
            console.error('Error hashing password: ' + err.message)
            return res.status(400).send({message: 'Error hashing password'})
        } else {
            let [user, created] = await User.findOrCreate({
                where: {email: _req.body.email},
                defaults: {
                    // required
                    password: hash,
                    role: role,
                    // optional
                    name: _req.body.name,
                    surname: _req.body.surname,
                    nickName: _req.body.nickName,
                    age: _req.body.age
                }
            })

            if (created) {
                console.log('User successfully registered under id ' + user.id + ' with email ' + user.email)
                return res.status(200).json({message: 'Successfully registered'})
            } else {
                console.log('User not registered')

                if (user != undefined) {
                    console.log('User already exists under id ' + user.id)
                    return res.status(200).json({message: 'User already registered'})
                } else {
                    console.warn('Error creating user')
                    return res.status(400).send({message: 'Error registering user'})
                }
            }
        }
    })
}

exports.loginUser = async (_req: Request, res: Response, _next: NextFunction) => {
    console.log('User started login process')

    if (_req.body.email == undefined)
        return res.status(400).json({message: 'Email address is required'})
    if (_req.body.password == undefined)
        return res.status(400).json({message: 'Password is required'})

    let user: UserModel = await User.findOne({
        where: {email: _req.body.email}
    })

    if (!user) {
        console.log('User with email ' + _req.body.email + ' not found')
        return res.status(400).send({message: 'User does not exist'})
    }

    bcrypt.compare(_req.body.password, user.password, (err, success) => {
        if (err) {
            return res.status(400).send({message: 'Error comparing passwords: ' + err.message})
        } else {
            if (success) {
                console.log('User logged in successfully')

                // create user object with only required data
                const user_data = {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                }

                // create jwt token to be used for authorization
                const jwt_token = jwt.sign(user_data, "SECRET_KEY", {expiresIn: '1h'})

                // save jwt token to user's cookies
                res.cookie('jwt', jwt_token, {
                    httpOnly: true,
                    expires: new Date(new Date().getTime() + 3600 * 1000), // 1h of seconds * 1000 ms
                })

                return res.status(200).json({message: 'Successfully logged in'})
            } else{
                return res.status(401).send({message: 'Wrong password'})
            }
        }
    })
}

