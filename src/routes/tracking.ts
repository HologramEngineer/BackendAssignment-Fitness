import {
	Router
} from 'express';
import passport from 'passport';
import {body} from "express-validator";

const router: Router = Router()
const trackingController = require('../controllers/trackingController')

export default () => {
	router.get('/',
		passport.authenticate('jwt', {session: false}),
		trackingController.getTrackedExercises)

	router.post('/',
		passport.authenticate('jwt', {session: false}),
		body('exerciseID').escape().notEmpty().isNumeric(),
		trackingController.postTrackedExercise)

	router.delete('/',
		passport.authenticate('jwt', {session: false}),
		body('id').escape().notEmpty().isNumeric(),
		trackingController.removeTrackedExercise)

	return router
}