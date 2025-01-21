import {NextFunction, Request, Response, Router} from 'express'

import {models} from '../db'
import passport from "passport";
import {UserModel} from "../db/user";
import {EXERCISE_DIFFICULTY, ROLE} from "../utils/enums";
import {ExerciseModel} from "../db/exercise";
import {FindOptions} from "sequelize";

const router: Router = Router()

const {
    Exercise,
    Program
} = models

export default () => {
    router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
        let options:FindOptions = {
            include: [{
                model: Program,
                as: 'program'
            }]
        }

        if (_req.query.page && _req.query.limit)
        {
            console.log('Doing paginated search with limit ' + _req.query.limit + ' starting at page ' + _req.query.page)

            const limit = parseInt(<string>_req.query.limit)
            const offset = (parseInt(<string>_req.query.page) - 1) * limit

            options.limit = limit
            options.offset = offset

        }

        const exercises = await Exercise.findAll(options)

        return res.json({
            data: exercises,
            message: 'List of exercises'
        })
    })

    router.post('/', passport.authenticate('jwt', {session: false}),
        async (_req: Request, res: Response, _next: NextFunction) => {
            const user = _req.user as UserModel

            if (user.role != ROLE.ADMIN)
                return res.status(403).send('Creating, updating or deleting exercises requires ADMIN privileges.')

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
                return res.status(400).send(error)
            }
        })

    router.patch('/', passport.authenticate('jwt', {session: false}),
        async (_req: Request, res: Response, _next: NextFunction) => {
            const user = _req.user as UserModel

            if (user.role != ROLE.ADMIN)
                return res.status(403).send('Creating, updating or deleting exercises requires ADMIN privileges.')

            try {
                let newExercise = await Exercise.findOne({where: {id:_req.body.id}}) as ExerciseModel
                let update = false

                if (newExercise == undefined) {
                    return res.status(400).send('Exercise with id ' + _req.body.id + ' could not be found.')
                }

                if (_req.body.name != undefined) {
                    newExercise.name = _req.body.name
                    update = true
                }

                if (_req.body.difficulty != undefined) {
                    let diffString = (_req.body.difficulty as string).toUpperCase() as keyof typeof EXERCISE_DIFFICULTY
                    newExercise.difficulty = EXERCISE_DIFFICULTY[diffString]
                    update = true
                }

                // note: foreign key can't be updated this way because of model structure, and I'm not convinced it is needed
                //          admin should remove affected exercise completely and then create new one with proper programID

                if (!update)
                    return res.status(200).send('Nothing to update.')

                await newExercise.save()

                return res.status(200).send('Exercise with id ' + _req.body.id + ' updated successfully.')
            } catch (error) {
                return res.status(400).send(error)
            }
        })

    router.delete('/', passport.authenticate('jwt', {session: false}),
        async (_req: Request, res: Response, _next: NextFunction) => {
            const user = _req.user as UserModel

            if (user.role != ROLE.ADMIN)
                return res.status(403).send('Creating, updating or deleting exercises requires ADMIN privileges.')

            try {
                const rowsUpdated = await Exercise.destroy({where: {id: _req.body.id}})

                if (rowsUpdated>0)
                    return res.status(200).send('Exercise with id ' + _req.body.id + ' deleted successfully.')
                else
                    return res.status(200).send('Exercise with id ' + _req.body.id + ' was not deleted. ' +
                        'Please check if it exists.')
            } catch (error) {
                return res.status(400).send(error)
            }
        })

    return router
}
