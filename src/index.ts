import http from 'http'
import express from 'express'
import * as bodyParser from 'body-parser'
import 'dotenv/config'

import {sequelize} from './db'
import passport from 'passport'
import {jwtStrategy} from './auth/jwtStrategy'
import cookieParser from 'cookie-parser'

import ProgramRouter from './routes/programs'
import ExerciseRouter from './routes/exercises'
import UserRouter from './routes/users'
import TrackingRouter from './routes/tracking'

const app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/programs', ProgramRouter())
app.use('/exercises', ExerciseRouter())
app.use('/users', UserRouter())
app.use('/tracking', TrackingRouter())

const httpServer = http.createServer(app)

passport.use(jwtStrategy)

sequelize.sync()

console.log('Sync database', 'postgresql://localhost:5432/fitness_app')

httpServer.listen(8000).on('listening', () => console.log(`Server started at port ${8000}`))

export default httpServer
