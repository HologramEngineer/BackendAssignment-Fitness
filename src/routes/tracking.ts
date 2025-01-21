import {
	Router
} from 'express';
import passport from 'passport';

const router: Router = Router()
const trackingController = require('../controllers/trackingController')

export default () => {
	router.get('/', passport.authenticate('jwt', {session: false}), trackingController.getTrackedExercises)
	router.post('/', passport.authenticate('jwt', {session: false}),trackingController.postTrackedExercise)
	router.delete('/', passport.authenticate('jwt', {session: false}),trackingController.removeTrackedExercise)

	return router
}