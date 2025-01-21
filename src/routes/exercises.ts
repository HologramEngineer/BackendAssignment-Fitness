import {Router, Request, Response, NextFunction} from 'express'

import {models} from '../db'
import passport from "passport";

const router: Router = Router()

const {
    Exercise,
    Program
} = models

export default () => {
    router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
        const exercises = await Exercise.findAll({
            include: [{
                model: Program,
                as: 'program'
            }]
        })

        return res.json({
            data: exercises,
            message: 'List of exercises'
        })
    })

    router.post('/', passport.authenticate('jwt', {session: false}),
        async (req: Request, res: Response, next: NextFunction) => {
            console.log(req.user)

            return res.status(200).json({})
        })

    return router
}
