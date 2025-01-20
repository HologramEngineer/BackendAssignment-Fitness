import {Strategy as JwtStrategy, StrategyOptionsWithoutRequest} from 'passport-jwt'
import {UserModel} from "../db/user";
import {Request} from "express";

const cookieExtractor = function (req: Request) {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwt'];
    }
    return token;
}

const options: StrategyOptionsWithoutRequest = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET
}

// export const jwtStrategy = new JwtStrategy(
//     options,
//     done
// ) {
//     return done(null, UserModel)
// };