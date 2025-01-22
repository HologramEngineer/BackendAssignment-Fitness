import {NextFunction, Request, Response, Router} from 'express'

import {models} from '../db'
import passport from "passport";
import {UserModel} from "../db/user";
import {EXERCISE_DIFFICULTY, ROLE} from "../utils/enums";
import {ExerciseModel} from "../db/exercise";
import {FindOptions} from "sequelize";
import {body, validationResult} from "express-validator";

const router: Router = Router()

const {
	Exercise,
	Program
} = models

export default () => {
	// 	GET
	//	Returns list of all exercises in database
	// 	Can be further specified by page + limits, program id, and / or fulltext search
	router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
		let options: FindOptions = {
			include: [{
				model: Program,
				as: 'program'
			}]
		}

		//	note: didn't use express-validator because all parameters here are optional, and I'm not sure if it's possible
		//		to use it this way

		if (_req.query.page && _req.query.limit) {
			console.log('Doing paginated search with limit ' + _req.query.limit + ' starting at page ' + _req.query.page)

			const limit = parseInt(<string>_req.query.limit)
			const offset = (parseInt(<string>_req.query.page) - 1) * limit

			if (limit == undefined || isNaN(limit)  || offset == undefined || isNaN(offset))
			{
				return res.status(400).send("Invalid query parameters")
			}

			options.limit = limit
			options.offset = offset

		}

		if (_req.query.programID) {
			if (_req.query.search) {
				console.log('Filtering exercise by name: ' + _req.query.search + ' and program: ' + _req.query.programID)

				options.where = {
					name: _req.query.search,
					programID: _req.query.programID
				}
			} else {
				console.log('Filtering exercise search by program: ' + _req.query.programID)

				options.where = {programID: _req.query.programID}
			}
		} else if (_req.query.search) {
			console.log('Filtering exercise by name: ' + _req.query.search)

			options.where = {name: _req.query.search}
		}

		const exercises = await Exercise.findAll(options)

		return res.json({
			data: exercises,
			message: 'List of exercises'
		})
	})

	//	POST
	//	[ADMIN] Creates new exercise
	router.post('/',
		passport.authenticate('jwt', {session: false}),
		body('name').escape().notEmpty(),
		body('programID').escape().notEmpty().isNumeric(),
		async (_req: Request, res: Response, _next: NextFunction) => {
			const user = _req.user as UserModel

			if (user.role != ROLE.ADMIN)
				return res.status(403).send('Creating, updating or deleting exercises requires ADMIN privileges.')

			const validRes = validationResult(_req);
			if (!validRes.isEmpty()) {
				return res.status(400).send('Invalid request parameters')
			}

			let diff: EXERCISE_DIFFICULTY

			if (_req.body.difficulty != undefined) {
				const diffString = (_req.body.difficulty as string).toUpperCase() as keyof typeof EXERCISE_DIFFICULTY
				diff = EXERCISE_DIFFICULTY[diffString]
			}

			try {
				const newExercise = await Exercise.create({
					name: _req.body.name,
					difficulty: diff,
					programID: _req.body.programID
				})

				if (newExercise == undefined) {
					return res.status(400).send('Something went wrong creating exercise.')
				}

				return res.status(200).send('Exercise created successfully.')
			} catch (error) {
				return res.status(500).send('Error processing request')
			}
		})

	//	PATCH
	//	[ADMIN] Updates existing exercise
	router.patch('/',
		passport.authenticate('jwt', {session: false}),
		body('id').escape().notEmpty().isNumeric(),
		async (_req: Request, res: Response, _next: NextFunction) => {
			const user = _req.user as UserModel

			if (user.role != ROLE.ADMIN)
				return res.status(403).send('Creating, updating or deleting exercises requires ADMIN privileges.')

			const validRes = validationResult(_req);
			if (!validRes.isEmpty()) {
				return res.status(400).send('Invalid request parameters')
			}

			try {
				let exerciseToUpdate = await Exercise.findOne({where: {id: _req.body.id}}) as ExerciseModel
				let update = false

				if (exerciseToUpdate == undefined) {
					return res.status(400).send('Exercise with id ' + _req.body.id + ' could not be found.')
				}

				if (_req.body.name != undefined) {
					exerciseToUpdate.name = _req.body.name
					update = true
				}

				if (_req.body.difficulty != undefined) {
					let diffString = (_req.body.difficulty as string).toUpperCase() as keyof typeof EXERCISE_DIFFICULTY
					exerciseToUpdate.difficulty = EXERCISE_DIFFICULTY[diffString]
					update = true
				}

				// note: foreign key can't be updated this way because of model structure, and I'm not convinced it is needed
				//          admin should remove affected exercise completely and then create new one with proper programID

				if (!update)
					return res.status(200).send('Nothing to update.')

				await exerciseToUpdate.save()

				return res.status(200).send('Exercise with id ' + _req.body.id + ' updated successfully.')
			} catch (error) {
				return res.status(500).send('Error processing request')
			}
		})

	//	DELETE
	//	[ADMIN] Removes selected exercise
	router.delete('/',
		passport.authenticate('jwt', {session: false}),
		body('id').escape().notEmpty().isNumeric(),
		async (_req: Request, res: Response, _next: NextFunction) => {
			const user = _req.user as UserModel

			if (user.role != ROLE.ADMIN)
				return res.status(403).send('Creating, updating or deleting exercises requires ADMIN privileges.')

			const validRes = validationResult(_req);
			if (!validRes.isEmpty()) {
				return res.status(400).send('Invalid request parameters')
			}

			try {
				const rowsUpdated = await Exercise.destroy({where: {id: _req.body.id}})

				if (rowsUpdated > 0)
					return res.status(200).send('Exercise with id ' + _req.body.id + ' deleted successfully.')
				else
					return res.status(200).send('Exercise with id ' + _req.body.id + ' was not deleted. ' +
						'Please check if it exists.')
			} catch (error) {
				return res.status(500).send('Error processing request')
			}
		})

	return router
}
