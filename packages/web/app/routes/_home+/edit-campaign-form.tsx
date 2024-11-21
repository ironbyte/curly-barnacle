import { useFetcher } from '@remix-run/react'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	getDayName,
	type CampaignModel,
	type CampaignScheduleModel,
} from '@titan/core/schema'

import { DatePickerConform } from '~/components/conform/date-picker'
import { CheckboxGroupField, Field, SelectField } from '~/components/forms'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/ui/dialog'
import { CampaignActionIntent, type action } from './_index'
import {
	campaignTypeEnum,
	dayOfWeekEnum,
	editCampaignSchema,
} from './validation.schema'

export function EditCampaignFormDialog({
	campaign,
}: {
	campaign: CampaignModel & {
		schedule: CampaignScheduleModel
	}
}) {
	const editCampaignFetcher = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'confirm-pending-event-form',
		lastResult:
			editCampaignFetcher.state === 'idle'
				? editCampaignFetcher?.data?.result
				: null,
		onValidate({ formData }) {
			const submission = parseWithZod(formData, {
				schema: editCampaignSchema,
			})

			if (submission.status !== 'success') {
				console.log('submission errors:', submission.error)
				console.log('submission payload: ', submission.payload)
				console.log('submission reply: ', submission.reply())
				console.log('submission status: ', submission.status)
			}

			return submission
		},
		constraint: getZodConstraint(editCampaignSchema),
		defaultValue: {
			name: campaign.name,
			type: campaign.type,
			dayOfWeekList: campaign.schedule.dayOfWeekList.map((d) => getDayName(d)),
			startDate: campaign.schedule.startDate,
			endDate: campaign.schedule.endDate,
			startTime: campaign.schedule.startTime,
			endTime: campaign.schedule.endTime,
		},
	})

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className="w-full md:w-fit">
					<span>Edit</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						Edit Campaign
					</DialogTitle>
					<DialogDescription>
						<editCampaignFetcher.Form
							method="post"
							{...getFormProps(form)}
							className="flex flex-col"
						>
							<input type="hidden" name="id" value={campaign.id} />

							<Field
								labelProps={{
									children: 'Name',
								}}
								inputProps={{
									...getInputProps(fields.name, {
										type: 'text',
									}),
								}}
								errors={fields.name.errors}
							/>

							<SelectField
								labelProps={{
									children: 'Campaign Type',
								}}
								className="w-full"
								placeholder={'Select...'}
								meta={fields.type}
								items={campaignTypeEnum.map((i) => ({
									value: i,
									name: i,
								}))}
								errors={fields.type.errors}
							/>

							<DatePickerConform
								meta={fields.startDate}
								labelProps={{
									children: 'Start Date',
								}}
								errors={fields.startDate.errors}
							/>

							<DatePickerConform
								meta={fields.endDate}
								labelProps={{
									children: 'End Date',
								}}
								errors={fields.endDate.errors}
							/>

							<div className="flex gap-2">
								<Field
									className="w-fit"
									labelProps={{
										children: 'Start Time',
									}}
									inputProps={{
										...getInputProps(fields.startTime, {
											type: 'time',
										}),
									}}
									errors={fields.startTime.errors}
								/>

								<Field
									className="w-fit"
									labelProps={{
										children: 'End Time',
									}}
									inputProps={{
										...getInputProps(fields.endTime, {
											type: 'time',
										}),
									}}
									errors={fields.endTime.errors}
								/>
							</div>

							<CheckboxGroupField
								labelProps={{
									children: 'Day of week',
								}}
								meta={fields.dayOfWeekList}
								errors={fields.dayOfWeekList.errors}
								items={dayOfWeekEnum.map((i) => ({
									value: i,
									name: i,
								}))}
							/>
							<Button
								type="submit"
								name="intent"
								value={CampaignActionIntent.EditCampaign}
							>
								{editCampaignFetcher.state === 'submitting'
									? 'Submitting'
									: 'Submit'}
							</Button>
						</editCampaignFetcher.Form>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	)
}
