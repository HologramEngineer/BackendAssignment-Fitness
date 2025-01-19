import {
    Sequelize,
    DataTypes,
} from "sequelize";
import {DatabaseModel} from "../types/db";

import {ROLE} from "../utils/enums";

export class UserModel extends DatabaseModel {
    id: number
    name: string
    surname: string
    nickName: string
    email: string
    age: number
    role: ROLE
    password: string
}

export default (sequelize: Sequelize) => {
    UserModel.init({
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(200)
        },
        surname: {
            type: DataTypes.STRING(200)
        },
        nickName: {
            type: DataTypes.STRING(200)
        },
        email: {
            type: DataTypes.STRING(200),
            unique: true
        },
        age: {
            type: DataTypes.INTEGER,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(ROLE))
        },
        password: {
            type: DataTypes.STRING(200)
        }
    }, {
        paranoid: true,
        timestamps: true,
        sequelize,
        modelName: 'user'
    })

    return UserModel
}