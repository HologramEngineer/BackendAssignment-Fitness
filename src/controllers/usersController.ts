import {NextFunction, Request, Response} from "express"

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import {models} from '../db'
import {ROLE} from "../utils/enums"
import {UserModel} from "../db/user";
import {validationResult} from "express-validator";


const {
	User
} = models

//  PUT
//  Registers new user
exports.registerUser = async (_req: Request, res: Response, _next: NextFunction) => {
	console.log('User started registration process')

	const validRes = validationResult(_req);
	if (!validRes.isEmpty()) {
		return res.status(400).send('Invalid request parameters')
	}

	let roleString = (_req.body.role as string).toUpperCase() as keyof typeof ROLE
	const role = ROLE[roleString]

	if (role == undefined)
		return res.status(400).send({message: 'Proper role is required'})

	bcrypt.hash(_req.body.password, 10, async (err, hash) => {
		if (err) {
			console.error('Error hashing password: ' + err.message)
			return res.status(500).send({message: 'Error hashing password'})
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
				return res.status(200).send({message: 'Successfully registered'})
			} else {
				console.log('User not registered')

				if (user != undefined) {
					console.log('User already exists under id ' + user.id)
					return res.status(200).send({message: 'User already registered'})
				} else {
					console.warn('Error creating user')
					return res.status(500).send({message: 'Error registering user'})
				}
			}
		}
	})
}

//	GET
//	Checks users email, password and creates JWT for further authorization
exports.loginUser = async (_req: Request, res: Response, _next: NextFunction) => {
	console.log('User started login process')

	const validRes = validationResult(_req);
	if (!validRes.isEmpty()) {
		return res.status(400).send('Invalid request parameters')
	}

	let user: UserModel = await User.findOne({
		where: {email: _req.body.email}
	})

	if (!user) {
		console.log('User with email ' + _req.body.email + ' not found')
		return res.status(400).send({message: 'User does not exist'})
	}

	bcrypt.compare(_req.body.password, user.password, (err, success) => {
		if (err) {
			return res.status(500).send({message: 'Error comparing passwords'})
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
					expires: new Date(new Date().getTime() + parseInt(process.env.JWT_COOKIE_EXPIRATION)),
				})

				return res.status(200).send({message: 'Successfully logged in'})
			} else {
				return res.status(401).send({message: 'Wrong password'})
			}
		}
	})
}

//	GET
//	Logs out user by removing "jwt" cookie
exports.logoutUser = async (_req: Request, res: Response, _next: NextFunction) => {
	res.clearCookie('jwt')
	return res.status(200).send({message: 'User logged out'})
}

//	GET
//	[ADMIN/USER] Returns user data based on requesters role
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

//	GET
//	[ADMIN/USER] Returns data of selected user based on requesters role
//	MVC type of get on endpoint ../users/id
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

			const currentUserData = await User.findOne({
				where: {id: id},
				attributes: ['name', 'surname', 'age', 'nickName'],
			})
			return res.status(200).json({
				data: currentUserData,
				message: 'Data for current user'
			})
	}
}

//	GET
//	[ADMIN/USER] Returns data of currently logged-in user
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
			const userData = await User.findOne({
				where: {id: user.id},
				attributes: ['name', 'surname', 'age', 'nickName'],
			})
			return res.status(200).json({
				data: userData,
				message: 'My data'
			})
	}
}

//	PATCH
//	[ADMIN] Updates data of selected user
exports.updateUser = async (_req: Request, res: Response, _next: NextFunction) => {
	const user = _req.user as UserModel
	if (user.role != ROLE.ADMIN)
		return res.status(403).send({message: 'Updating user data requires ADMIN privileges'})

	const validRes = validationResult(_req);
	if (!validRes.isEmpty()) {
		return res.status(400).send('Invalid request parameters')
	}

	try {
		let userToUpdate = await User.findOne({where: {id: _req.body.id}}) as UserModel
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
		return res.status(500).send('Error processing request')
	}
}

