import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express'

import {models} from '../db'
import passport from "passport";
import {UserModel} from "../db/user";
import {ROLE} from "../utils/enums";
import {ProgramModel} from "../db/program";
import {body, validationResult} from "express-validator";

const router: Router = Router()

const {
    Program,
    Exercise
} = models

export default () => {
    //  GET
    //  Returns list of all programs in database
    router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
        const programs = await Program.findAll()
        return res.json({
            data: programs,
            message: 'List of programs'
        })
    })

    //  POST
    //  [ADMIN] Creates new program
    router.post('/',
        passport.authenticate('jwt', {session: false}),
        body('name').escape().notEmpty(),
        async (_req: Request, res: Response, _next: NextFunction) => {
            const user = _req.user as UserModel

            if (user.role != ROLE.ADMIN)
                return res.status(403).send('Creating, updating or deleting programs requires ADMIN privileges.')

            const validRes = validationResult(_req);
            if (!validRes.isEmpty()) {
                return res.status(400).send('Invalid request parameters')
            }

            try {
                const newProgram = await Program.create({
                    name: _req.body.name
                })

                if (newProgram == undefined) {
                    return res.status(400).send('Something went wrong creating program.')
                }

                return res.status(200).send({message: 'Program created successfully.'})
            } catch (error) {
                return res.status(500).send('Error processing request')
            }
        })

    //  PATCH
    //  [ADMIN] Updates selected program
    router.patch('/',
        passport.authenticate('jwt', {session: false}),
        body('name').escape().notEmpty(),
        body('id').escape().notEmpty().isNumeric(),
        async (_req: Request, res: Response, _next: NextFunction) => {
            const user = _req.user as UserModel

            if (user.role != ROLE.ADMIN)
                return res.status(403).send('Creating, updating or deleting programs requires ADMIN privileges.')

            const validRes = validationResult(_req);
            if (!validRes.isEmpty()) {
                return res.status(400).send('Invalid request parameters')
            }

            try {
                let program = await Program.findOne({where: {id: _req.body.id}}) as ProgramModel

                if (program == undefined) {
                    return res.status(400).send('Program with id ' + _req.body.id + ' could not be found.')
                }

                program.name = _req.body.name
                await program.save()

                return res.status(200).send('Program with id ' + _req.body.id + ' updated successfully.')
            } catch (error) {
                return res.status(500).send('Error processing request')
            }
        })

    //  DELETE
    //  [ADMIN] Removes selected program and its associated exercises
    router.delete('/', passport.authenticate('jwt', {session: false}),
        body('id').escape().notEmpty().isNumeric(),
        async (_req: Request, res: Response, _next: NextFunction) => {
            const user = _req.user as UserModel

            if (user.role != ROLE.ADMIN)
                return res.status(403).send('Creating, updating or deleting programs requires ADMIN privileges.')

            const validRes = validationResult(_req);
            if (!validRes.isEmpty()) {
                return res.status(400).send('Invalid request parameters')
            }

            try {
                const program = await Program.findOne(
                    {
                        where: {id: _req.body.id},
                        include: [{
                            model: Exercise,
                            as: 'translations'
                        }]
                    }) as ProgramModel

                if (program == undefined)
                    return res.status(200).send('Program with id ' + _req.body.id + ' was not deleted. ' +
                        'Please check if it exists.')

                // @ts-ignore
                for (let i = 0; i < program.translations.length; i++) {
                    // @ts-ignore
                    await program.translations[i].destroy()
                }

                program.destroy()

                return res.status(200).send('Program with id ' + _req.body.id + ' deleted successfully.')
            } catch (error) {
                return res.status(500).send('Error processing request')
            }
        })

    return router
}
