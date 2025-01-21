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

const router: Router = Router()

const {
    Program
} = models

export default () => {
    router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
        const programs = await Program.findAll()
        return res.json({
            data: programs,
            message: 'List of programs'
        })
    })

    router.post('/', passport.authenticate('jwt', {session: false}),
        async (_req: Request, res: Response, _next: NextFunction) => {
            let user = _req.user as UserModel

            if (user.role != ROLE.ADMIN)
                return res.status(403).send('Creating, updating or deleting programs requires ADMIN privileges.')

            try {
                let newProgram = await Program.create({
                    name: _req.body.name
                })

                if (newProgram == undefined) {
                    return res.status(400).send('Something went wrong creating program.')
                }

                return res.status(200).json({message: 'Program created successfully.'})
            } catch (error) {
                return res.status(400).send(error)
            }
        })

    router.patch('/', passport.authenticate('jwt', {session: false}),
        async (_req: Request, res: Response, _next: NextFunction) => {
            let user = _req.user as UserModel

            if (user.role != ROLE.ADMIN)
                return res.status(403).send('Creating, updating or deleting programs requires ADMIN privileges.')

            // todo: check if _req.body.name is set before trying to update it

            try {
                let program = await Program.findOne({where: {id: _req.body.id}}) as ProgramModel

                if (program == undefined) {
                    return res.status(400).send('Program with id ' + _req.body.id + ' could not be found.')
                }

                program.name = _req.body.name
                await program.save()

                return res.status(200).send('Program with id ' + _req.body.id + ' updated successfully.')
            } catch (error) {
                return res.status(400).send(error)
            }
        })

    router.delete('/', passport.authenticate('jwt', {session: false}),
        async (_req: Request, res: Response, _next: NextFunction) => {
            let user = _req.user as UserModel

            if (user.role != ROLE.ADMIN)
                return res.status(403).send('Creating, updating or deleting programs requires ADMIN privileges.')

            try {
                // todo: try to delete associated exercises when deleting program

                const rowsUpdated = await Program.destroy({where: {id: _req.body.id}})

                if (rowsUpdated>0)
                    return res.status(200).send('Program with id ' + _req.body.id + ' deleted successfully.')
                else
                    return res.status(200).send('Program with id ' + _req.body.id + ' was not deleted. ' +
                        'Please check if it exists.')

            } catch (error) {
                return res.status(400).send(error)
            }
        })

    return router
}
