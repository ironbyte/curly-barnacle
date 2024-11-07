import { json, type LoaderFunctionArgs } from '@remix-run/node'
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react'

import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Toaster } from '~/components/ui/sonner'

import './tailwind.css'
import './font.css'

export const AppName = 'Titan'

export async function loader({ request }: LoaderFunctionArgs) {
	return json({})
}

export function Layout({ children }: { children: React.ReactNode }) {
	const theme = 'light'

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body
				suppressHydrationWarning
				className={`${theme} bg-background text-foreground h-full w-full antialiased transition duration-300`}
			>
				{children}
				<ScrollRestoration />
				<Scripts />
				<Toaster />
			</body>
		</html>
	)
}

export default function App() {
	return <Outlet />
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
