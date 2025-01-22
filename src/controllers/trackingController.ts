import {NextFunction, Request, Response} from "express"
import {UserModel} from "../db/user";
import {models} from "../db";
import {validationResult} from "express-validator";

const {
	Exercise,
	ExerciseHistory
} = models

//	GET
//	Returns all tracked exercises of logged-in user
exports.getTrackedExercises = async (_req: Request, res: Response, _next: NextFunction) => {
	const user = _req.user as UserModel

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
		message: 'List of tracked exercises'
	})
}

//	POST
//	Creates tracked exercise entry
//	Requires ID of tracked exercise, other fields can be left empty if desired
exports.postTrackedExercise = async (_req: Request, res: Response, _next: NextFunction) => {
	const user = _req.user as UserModel

	const validRes = validationResult(_req);
	if (!validRes.isEmpty()) {
		return res.status(400).send('Invalid request parameters')
	}

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

//	DELETE
//	Removes tracked exercise based on ID
//	Note: user can only remove their own tracked exercise
exports.removeTrackedExercise = async (_req: Request, res: Response, _next: NextFunction) => {
	const user = _req.user as UserModel

	const validRes = validationResult(_req);
	if (!validRes.isEmpty()) {
		return res.status(400).send('Invalid request parameters')
	}

	try {
		const rowsUpdated = await ExerciseHistory.destroy({
			where: {
				id: _req.body.id,
				userID: user.id
			}
		})

		if (rowsUpdated > 0)
			return res.status(200).send('Tracked exercise with id ' + _req.body.id + ' deleted successfully.')
		else
			return res.status(200).send('Tracked exercise with id ' + _req.body.id + ' was not deleted. ' +
				'Please check if it exists and if it belongs to you.')
	} catch (error) {
		return res.status(400).send(error)
	}
}