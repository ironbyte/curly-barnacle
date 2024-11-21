import { getDayName, getDayNumber } from '@titan/core/schema'
import { z } from 'zod'

export const campaignTypeEnum = [
	'Cost per Order',
	'Cost per Click',
	'Buy One Get One',
] as const

export const daysOfWeek = [0, 1, 2, 3, 4, 5, 6] as const
export const dayOfWeekEnum = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
] as const

export const campaignSchema = z.object({
	name: z.string().min(1),
	type: z.enum(campaignTypeEnum),
	dayOfWeekList: z.enum(dayOfWeekEnum).array().min(1),
	startDate: z.date(),
	startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
		message: 'Invalid time format. Must be HH:mm',
	}),
	endDate: z.date(),
	endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
		message: 'Invalid time format. Must be HH:mm',
	}),
})

export const addCampaignSchema = campaignSchema
	.refine(
		(data) => {
			const start = new Date(data.startDate)
			const end = new Date(data.endDate)
			return start <= end
		},
		{
			message: 'End date must be after or equal to start date',
			path: ['endDate'],
		},
	)
	.transform((data) => {
		const { dayOfWeekList: dayOfWeek, ...rest } = data

		return {
			dayOfWeekList: dayOfWeek.map((day) => getDayNumber(day)),
			...rest,
		}
	})

export const editCampaignSchema = campaignSchema
	.extend({
		id: z.string(),
	})
	.refine(
		(data) => {
			const start = new Date(data.startDate)
			const end = new Date(data.endDate)
			return start <= end
		},
		{
			message: 'End date must be after or equal to start date',
			path: ['endDate'],
		},
	)
	.transform((data) => {
		const { dayOfWeekList: dayOfWeek, ...rest } = data

		return {
			dayOfWeekList: dayOfWeek.map((day) => getDayNumber(day)),
			...rest,
		}
	})
