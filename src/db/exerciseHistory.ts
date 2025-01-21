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
			type: DataTypes.INTEGER	//duration in seconds, max value is slightly more than 68 years, I think it is enough
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