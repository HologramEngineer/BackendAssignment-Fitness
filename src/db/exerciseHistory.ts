import {
	Sequelize,
	DataTypes
} from 'sequelize'

import {DatabaseModel} from "../types/db";
import {ExerciseModel} from "./exercise";

export class ExerciseHistoryModel extends DatabaseModel {
	id: number
	dateOfCompletion: Date
	duration: number
	userID: number

	exercise: ExerciseModel
}

export default (sequelize: Sequelize) => {
	ExerciseHistoryModel.init({
		id: {
			type: DataTypes.BIGINT,
			primaryKey: true,
			allowNull: false,
			autoIncrement: true
		},
		dateOfCompletion: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		duration: {
			type: DataTypes.INTEGER,	//duration in seconds, max value is slightly more than 68 years, I think it is enough
			defaultValue: 0
		},
		userID: {
			type: DataTypes.BIGINT	//user ID is not foreign key as it should be, because I was unable to create 2 associations
									//	for one DatabaseModel, but I think I know why, and if I'm right it is not
									//	possible to make it work in this project
		}
	}, {
		paranoid: true,
		timestamps: true,
		sequelize,
		modelName: 'exerciseHistory',
	})

	ExerciseHistoryModel.associate = (models) => {
		(ExerciseHistoryModel as any).belongsTo(models.Exercise, {
			foreignKey: {
				name: 'exerciseID',
				allowNull: false
			}
		})
	}

	return ExerciseHistoryModel
}