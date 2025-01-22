import {
	Router
} from "express";
import passport from "passport";
import {body} from "express-validator";


const router: Router = Router()
const usersController = require('../controllers/usersController')

export default () => {
	router.post('/register',
		body('email').escape().notEmpty().isEmail(),
		body('password').escape().notEmpty(),
		body('role').escape().notEmpty(),
		usersController.registerUser);

	router.get('/login',
		body('email').escape().notEmpty().isEmail(),
		body('password').escape().notEmpty(),
		usersController.loginUser);

	router.get('/logout',
		usersController.logoutUser);

	//=================================

	router.get('/profile',
		passport.authenticate('jwt', {session: false}),
		usersController.getCurrentUser)
	router.get('/:id',
		passport.authenticate('jwt', {session: false}),
		usersController.getUser)
	router.get('/',
		passport.authenticate('jwt', {session: false}),
		usersController.getUsers)

	router.patch('/',
		passport.authenticate('jwt', {session: false}),
		body('id').escape().notEmpty(),
		usersController.updateUser)

	return router
}