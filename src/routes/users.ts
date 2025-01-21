import {
    Router
} from "express";
import passport from "passport";

const router: Router = Router()
const usersController = require('../controllers/usersController')

export default () => {
    router.post('/register', usersController.registerUser);
    router.get('/login', usersController.loginUser);

    router.get('/profile', passport.authenticate('jwt', {session: false}), usersController.getCurrentUser)
    router.get('/:id', passport.authenticate('jwt', {session: false}), usersController.getUser)
    router.get('/', passport.authenticate('jwt', {session: false}), usersController.getUsers)

    return router
}