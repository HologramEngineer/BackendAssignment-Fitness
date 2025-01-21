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
    const role = ROLE[roleString]

    if (role == undefined)
        return res.status(400).json({message: 'Proper role is required'})

    bcrypt.hash(_req.body.password, 10, async (err, hash) => {
        if (err) {
            console.error('Error hashing password: ' + err.message)
            return res.status(400).send({message: 'Error hashing password'})
        } else {
            const [user, created] = await User.findOrCreate({
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
                    email: user.email
                }

                // create jwt token to be used for authorization
                const jwt_token = jwt.sign(user_data, process.env.JWT_SECRET,
                    {expiresIn: process.env.JWT_COOKIE_EXPIRATION})

                // save jwt token to user's cookies
                res.cookie('jwt', jwt_token, {
                    httpOnly: true,
                    expires: new Date(new Date().getTime() + process.env.JWT_COOKIE_EXPIRATION),
                })

                return res.status(200).json({message: 'Successfully logged in'})
            } else{
                return res.status(401).send({message: 'Wrong password'})
            }
        }
    })
}

exports.logoutUser = async (_req: Request, res: Response, _next: NextFunction) => {
    res.clearCookie('jwt')
    return res.status(200).send({message: 'User logged out'})
}

exports.getUsers = async (_req: Request, res: Response, _next: NextFunction) => {
    const user = _req.user as UserModel

    switch (user.role) {
        case ROLE.ADMIN:
            console.log('Getting all users with their associated data')

            const fullUsers = await User.findAll()
            return res.status(200).json({
                data: fullUsers,
                message: 'All users with their associated data'
            })
        case ROLE.USER:
            console.log('Getting all users with only their ID and nick name')

            const limitedUsers = await User.findAll({
                attributes: ['id', 'nickName'],
            })
            return res.status(200).json({
                data: limitedUsers,
                message: 'All users with their limited data'
            })
    }
}

exports.getUser = async (_req: Request, res: Response, _next: NextFunction) => {
    const user = _req.user as UserModel
    const id = parseInt(_req.params.id)

    if (id == undefined)
        return res.status(400).send({message: 'Wrong user id'})

    console.log('Getting all data of single user')

    switch (user.role) {
        case ROLE.ADMIN:
            const userData = await User.findOne({where: {id: id}})
            return res.status(200).json({
                data: userData,
                message: 'All data for user ' + id
            })
        case ROLE.USER:
            console.log('Role: User, can access only their own data')

            if (user.id != id)
                return res.status(403).send({message: 'Can\'t access user'})

            const currentUserData = await User.findOne({where: {id: id},
                attributes: ['name', 'surname', 'age', 'nickName'],
            })
            return res.status(200).json({
                data: currentUserData,
                message: 'Data for current user'
            })
    }
}

exports.getCurrentUser = async (_req: Request, res: Response, _next: NextFunction) => {
    const user = _req.user as UserModel

    switch (user.role) {
        case ROLE.ADMIN:
            const adminData = await User.findOne({where: {id: user.id}})
            return res.status(200).json({
                data: adminData,
                message: 'My data'
            })
        case ROLE.USER:
            const userData = await User.findOne({where: {id: user.id},
                attributes: ['name', 'surname', 'age', 'nickName'],
            })
            return res.status(200).json({
                data: userData,
                message: 'My data'
            })
    }
}

exports.updateUser = async (_req: Request, res: Response, _next: NextFunction) => {
    const user = _req.user as UserModel
    if (user.role != ROLE.ADMIN)
        return res.status(403).send({message: 'Updating user data requires ADMIN privileges'})

    try {
        let userToUpdate = await User.findOne({where: {id:_req.body.id}}) as UserModel
        let update = false

        if (userToUpdate == undefined) {
            return res.status(400).send('User with id ' + _req.body.id + ' could not be found.')
        }

        if (_req.body.name != undefined) {
            userToUpdate.name = _req.body.name
            update = true
        }

        if (_req.body.surname != undefined) {
            userToUpdate.surname = _req.body.surname
            update = true
        }

        if (_req.body.nickName != undefined) {
            userToUpdate.nickName = _req.body.nickName
            update = true
        }

        if (_req.body.age != undefined) {
            userToUpdate.age = _req.body.age
            update = true
        }

        if (_req.body.role != undefined) {
            let roleString = (_req.body.role as string).toUpperCase() as keyof typeof ROLE
            userToUpdate.role = ROLE[roleString]
            update = true
        }

        if (!update)
            return res.status(200).send('User was not updated.')

        await userToUpdate.save()

        return res.status(200).send('User with id ' + _req.body.id + ' updated successfully.')
    } catch (error) {
        return res.status(400).send(error)
    }
}

