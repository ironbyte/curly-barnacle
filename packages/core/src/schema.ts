import { relations } from 'drizzle-orm'
import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { ulid } from 'ulidx'

import { timestamps, ulidType } from './types'

export const campaignTypeEnum = [
	'Cost per Order',
	'Cost per Click',
	'Buy One Get One',
] as const

// Days of week as numbers where 0 = Sunday, 6 = Saturday
export const daysOfWeek = [0, 1, 2, 3, 4, 5, 6] as const
export type DayOfWeek = (typeof daysOfWeek)[number]

export const campaignTypePgEnum = pgEnum('campaign_type', campaignTypeEnum)

export const campaigns = pgTable('campaigns', {
	id: ulidType('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	name: text('name').notNull().unique(),
	type: campaignTypePgEnum('campaign_type').notNull(),
	...timestamps,
})

export const campaignSchedules = pgTable('campaign_schedule', {
	id: ulidType('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	campaignId: ulidType('campaign_id').references(() => campaigns.id),
	dayOfWeekList: integer('day_of_week').array().notNull(),
	startDate: timestamp('start_date').notNull(), // ignore the time part
	endDate: timestamp('end_date').notNull(), // ignore the time part
	startTime: text('start_time').notNull(),
	endTime: text('end_time').notNull(),
})

export const campaignsRelations = relations(campaigns, ({ one }) => ({
	schedule: one(campaignSchedules, {
		fields: [campaigns.id],
		references: [campaignSchedules.campaignId],
	}),
}))

export const campaignSchedulesRelations = relations(
	campaignSchedules,
	({ one }) => ({
		campaign: one(campaigns, {
			fields: [campaignSchedules.campaignId],
			references: [campaigns.id],
		}),
	}),
)

export const getDayName = (day: DayOfWeek): string => {
	const days = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	]

	return days[day] as string // TypeScript doesn't like this :/
}

export const getDayNumber = (dayName: string): DayOfWeek => {
	const days = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	]
	const index = days.indexOf(dayName)

	if (index === -1) throw new Error('Invalid day name')

	return index as DayOfWeek
}

// Types
export type CampaignModel = typeof campaigns.$inferSelect
export type InsertCampaignModel = typeof campaigns.$inferInsert

export type CampaignScheduleModel = typeof campaignSchedules.$inferSelect
export type InsertCampaignScheduleModel = typeof campaignSchedules.$inferInsert
