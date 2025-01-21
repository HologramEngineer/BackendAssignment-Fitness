import {Strategy as JwtStrategy} from 'passport-jwt'
import {Request} from "express";
import {models} from '../db'

const {User} = models

const cookieExtractor = function (req:Request) {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwt'];
    }
    return token;
}

const options = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET
}

export const jwtStrategy = new JwtStrategy(
    options,
    async function (jwtPayload, done) {
        // looking for user in database
        let user = await User.findOne({where:{email: jwtPayload.email}})

        if (!user) {
            return done(new Error('User not found'), false)
        }

        return done(null, user);
    }
)
