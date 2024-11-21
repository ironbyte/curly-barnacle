import { useFetcher } from '@remix-run/react'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { getDayName } from '@titan/core/schema'

import { DatePickerConform } from '~/components/conform/date-picker'
import { CheckboxGroupField, Field, SelectField } from '~/components/forms'
import { Button } from '~/components/ui/button'
import { CardContent, CardFooter } from '~/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog'
import { CampaignActionIntent, type action } from './_index'
import {
	addCampaignSchema,
	campaignTypeEnum,
	dayOfWeekEnum,
} from './validation.schema'

export function AddCampaignForm() {
	const addCampaignFetcher = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'add-campaign-form',
		lastResult:
			addCampaignFetcher.state === 'idle'
				? addCampaignFetcher?.data?.result
				: null,
		onValidate({ formData }) {
			const submission = parseWithZod(formData, {
				schema: addCampaignSchema,
			})

			if (submission.status !== 'success') {
				console.log('submission errors:', submission.error)
				console.log('submission payload: ', submission.payload)
				console.log('submission reply: ', submission.reply())
				console.log('submission status: ', submission.status)
			}

			return submission
		},
		constraint: getZodConstraint(addCampaignSchema),
		shouldRevalidate: 'onInput',
		defaultValue: {
			name: '',
		},
	})

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className="w-fit">Add Campaign</Button>
			</DialogTrigger>
			<DialogContent>
				<addCampaignFetcher.Form
					method="post"
					{...getFormProps(form)}
					className="flex h-full flex-col"
				>
					<CardContent className="space-y-3">
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
					</CardContent>
					<CardFooter>
						<Button
							type="submit"
							name="intent"
							value={CampaignActionIntent.CreateCampaign}
						>
							{addCampaignFetcher.state === 'submitting'
								? 'Submitting'
								: 'Submit'}
						</Button>
					</CardFooter>
				</addCampaignFetcher.Form>
			</DialogContent>
		</Dialog>
	)
}
