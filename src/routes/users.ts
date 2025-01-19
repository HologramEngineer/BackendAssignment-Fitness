import {
    Router
} from "express";

const router: Router = Router()
const usersController = require('../controllers/usersController')

export default () => {
    router.post('/register', usersController.registerUser);
    router.get('/login', usersController.loginUser);
    return router
}