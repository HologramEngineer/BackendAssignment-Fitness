import {NextFunction, Request, Response} from "express"
import {UserModel} from "../db/user";
import {models} from "../db";

const {
	Exercise,
	ExerciseHistory
} = models

exports.getTrackedExercises = async (_req: Request, res: Response, _next: NextFunction) => {
	let user = _req.user as UserModel

	const trackedExercises = await ExerciseHistory.findAll({
		where: {userID: user.id},
		include: [{
			model: Exercise,
			as: 'exercise',
			attributes: ['name', 'difficulty', 'programID'],
		}],
		attributes: ['id', 'dateOfCompletion', 'duration']
	})

	return res.json({
		data: trackedExercises,
		message: 'List of exercises'
	})
}

exports.postTrackedExercise = async (_req: Request, res: Response, _next: NextFunction) => {
	let user = _req.user as UserModel

	try {
		const createdExercise = await ExerciseHistory.create({
			userID: user.id,
			exerciseID: _req.body.exerciseID,
			dateOfCompletion: _req.body.dateOfCompletion,
			duration: _req.body.duration,
		})

		if (createdExercise == undefined) {
			return res.status(400).send('Something went wrong creating exercise.')
		}

		return res.status(200).send('Exercise created successfully.')
	} catch (error) {
		return res.status(400).send(error)
	}
}