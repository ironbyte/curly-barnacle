import {
	json,
	type ActionFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import * as React from 'react'
import { parseWithZod } from '@conform-to/zod'
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnFiltersState,
	type SortingState,
} from '@tanstack/react-table'
import { db } from '@titan/core/db'
import {
	campaigns,
	campaignSchedules,
	getDayName,
	type InsertCampaignModel,
	type InsertCampaignScheduleModel,
} from '@titan/core/schema'
import { format, formatDate, isBefore } from 'date-fns'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { BadgesList } from '~/components/badges-list'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'
import { AppName } from '~/root'
import { AddCampaignForm } from './add-campaign-form'
import { EditCampaignFormDialog } from './edit-campaign-form'
import { addCampaignSchema, editCampaignSchema } from './validation.schema'

const DATE_FORMAT = 'dd/MM/yyyy' as const

export enum CampaignActionIntent {
	CreateCampaign = 'create-campaign',
	EditCampaign = 'edit-campaign',
}

export const meta: MetaFunction = () => {
	return [
		{ title: `${AppName}` },
		{ name: 'description', content: `${AppName}` },
	]
}

export async function loader() {
	const campaignsList = await db.query.campaigns.findMany({
		orderBy: (campaigns, { asc }) => [asc(campaigns.id)],
		with: {
			schedule: true,
		},
	})

	return json({
		campaigns: campaignsList,
	})
}

type CreateCampaignActionArgs = {
	formData: FormData
}

async function createCampaignAction({ formData }: CreateCampaignActionArgs) {
	const submission = await parseWithZod(formData, {
		schema: addCampaignSchema.superRefine(async (data, ctx) => {
			const { name } = data

			const existingCampaignWithSameName = await db.query.campaigns.findFirst({
				where: (campaigns, { eq }) => eq(campaigns.name, name),
				columns: { id: true },
			})

			if (!existingCampaignWithSameName) {
				return
			}

			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Campaign with this name already exists',
				path: ['name'],
			})
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	await db.transaction(async (trx) => {
		const newCampaignInsert: InsertCampaignModel = {
			...submission.value,
		}

		const [insertedCampaign] = await trx
			.insert(campaigns)
			.values(newCampaignInsert)
			.returning({
				id: campaigns.id,
			})

		if (!insertedCampaign) {
			throw new Error('Error creating a new campaign')
		}

		const newCampaignSchedule: InsertCampaignScheduleModel = {
			campaignId: insertedCampaign.id,
			dayOfWeekList: submission.value.dayOfWeekList,
			startDate: submission.value.startDate,
			endDate: submission.value.endDate,
			startTime: submission.value.startTime,
			endTime: submission.value.endTime,
		}

		await trx.insert(campaignSchedules).values(newCampaignSchedule)
	})

	return json({
		result: submission.reply({ resetForm: true, fieldErrors: {} }),
	})
}

async function editCampaignAction({ formData }: CreateCampaignActionArgs) {
	const submission = await parseWithZod(formData, {
		schema: editCampaignSchema.superRefine(async (data, ctx) => {
			const { name } = data

			const existingCampaignWithSameName = await db.query.campaigns.findFirst({
				where: (campaigns, { eq }) => eq(campaigns.name, name),
				columns: { id: true, name: true },
			})

			if (
				!existingCampaignWithSameName ||
				existingCampaignWithSameName.name === name
			) {
				return
			}

			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Campaign with this name already exists',
				path: ['name'],
			})
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	await db.transaction(async (trx) => {
		const campaign = await trx.query.campaigns.findFirst({
			where: eq(campaigns.id, submission.value.id),
			with: {
				schedule: true,
			},
		})

		if (!campaign) {
			throw new Error('Campaign not found')
		}

		await trx
			.update(campaigns)
			.set({
				...submission.value,
			})
			.where(eq(campaigns.id, submission.value.id))

		console.log('SUBMISSION.VALUE: ', submission.value)

		await trx
			.update(campaignSchedules)
			.set({
				...submission.value,
			})
			.where(eq(campaignSchedules.campaignId, submission.value.id))
	})

	return json({
		result: submission.reply({ resetForm: true, fieldErrors: {} }),
	})
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()

	const intent = formData.get('intent')

	switch (intent) {
		case CampaignActionIntent.CreateCampaign: {
			return createCampaignAction({
				formData,
			})
		}

		case CampaignActionIntent.EditCampaign: {
			return editCampaignAction({
				formData,
			})
		}

		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 })
		}
	}
}

export default function Index() {
	const loaderData = useLoaderData<typeof loader>()
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	)

	type Campaign = (typeof loaderData.campaigns)[number]
	const columnHelper = createColumnHelper<Campaign>()

	const columns = React.useMemo(
		() => [
			columnHelper.accessor('name', {
				cell: (info) => info.getValue(),
				header: 'Campaign Name',
			}),

			columnHelper.accessor('type', {
				header: 'Type',
				cell: ({ getValue }) => {
					return getValue()
				},
			}),

			columnHelper.accessor('schedule.startDate', {
				cell: (info) => {
					const startDate = info.getValue()
					return startDate ? formatDate(startDate, DATE_FORMAT) : ''
				},
				header: 'Start Date',
			}),
			columnHelper.accessor('schedule.endDate', {
				cell: (info) => {
					const endDate = info.getValue()
					return endDate ? formatDate(endDate, DATE_FORMAT) : ''
				},
				header: 'End Date',
			}),

			columnHelper.accessor('schedule.dayOfWeekList', {
				cell: (info) => {
					const list = info.getValue()

					return <BadgesList items={list.map((d) => getDayName(d))} />
				},
				header: 'Days of week',
			}),

			columnHelper.accessor('schedule.startTime', {
				cell: (info) => {
					const startTime = info.getValue()

					return startTime
				},
				header: 'Start Time',
			}),

			columnHelper.accessor('schedule.endTime', {
				cell: (info) => {
					const endTime = info.getValue()

					return endTime
				},
				header: 'End Time',
			}),

			columnHelper.accessor('schedule.startDate', {
				cell: ({ row }) => {
					const startDate = new Date(row.original.schedule.startDate)
					const endDate = new Date(row.original.schedule.endDate)
					const startTimeString = row.original.schedule.startTime
					const endTimeString = row.original.schedule.endTime
					// ! Reminder - Days are represented as numbers where 0 = Sunday, 6 = Saturday
					const dayOfWeeks = row.original.schedule.dayOfWeekList

					const [startTimeHours, startTimeMinutes] = startTimeString
						.split(':')
						.map(Number) as [number, number] // Yep, TypeScript doesn't like this. Kind of pressed foir time

					const [endTimeHours, endTimeMinutes] = endTimeString
						.split(':')
						.map(Number) as [number, number]

					const now = new Date()

					// If current date is past end date or before start date, 'Not scheduled'
					if (now > endDate) {
						return 'Ended'
					} else if (now < startDate) {
						return format(startDate, DATE_FORMAT)
					}

					console.log('startTimeHours: ', startTimeHours)
					console.log('startTimeMinutes: ', startTimeMinutes)
					console.log('endTimeHours: ', endTimeHours)
					console.log('endTimeMinutes: ', endTimeMinutes)
					// ! First check if today is the day of the campaign

					// if today is the day of the campaign, check if the campaign is scheduled
					if (dayOfWeeks.includes(now.getDay())) {
						console.log("DEBUG: Today's day of the week")

						const campaignScheduleStart = new Date(now)

						campaignScheduleStart.setHours(
							startTimeHours,
							startTimeMinutes,
							0,
							0,
						)

						const campaignScheduleEnd = new Date(now)
						campaignScheduleEnd.setHours(endTimeHours, endTimeMinutes, 0, 0)

						console.log('campaignScheduleStart: ', campaignScheduleStart)
						console.log('campaignScheduleEnd: ', campaignScheduleEnd)

						if (isBefore(campaignScheduleStart, campaignScheduleEnd)) {
							console.log('DEBUG: Campaign is scheduled')

							return format(campaignScheduleStart, DATE_FORMAT)
						}
					}

					// Todo
					// Kind of run out of time to implement this one
					// if today is not the day of the campaign, calculate the very next scheduled campaign date

					return 'N/A'
				},
				header: 'Next scheduled date',
			}),

			columnHelper.accessor('id', {
				header: 'Actions',
				enableHiding: false,
				cell: ({ row }) => {
					return (
						<div className="flex gap-2">
							<EditCampaignFormDialog campaign={row.original} />
						</div>
					)
				},
			}),
		],
		[],
	)

	const tableInstance = useReactTable({
		data: loaderData.campaigns,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
			columnFilters,
		},
	})

	return (
		<div className="bg-card container relative flex h-full w-full flex-col">
			<h1 className="text-h1 text-primary text-4xl font-bold">
				Moncy's Campaign Management App
			</h1>

			<div className="mb-4 flex justify-end">
				<AddCampaignForm />
			</div>
			<div className="w-full rounded-md border">
				<Table>
					<TableHeader>
						{tableInstance.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id} className={'text-left'}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{tableInstance.getRowModel().rows?.length ? (
							tableInstance.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									{'No results'}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
