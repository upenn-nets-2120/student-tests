import { useLayoutEffect } from "react"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import {
	isRouteErrorResponse,
	Outlet,
	useNavigate,
	useRouteError,
} from "react-router-dom"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { UserStateNullError } from "@/lib/error"
import { cn } from "@/lib/utils"

const Fallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
	const navigate = useNavigate()

	useLayoutEffect(() => {
		if (error instanceof UserStateNullError) {
			navigate("/login")
			resetErrorBoundary()
		}
	}, [error, resetErrorBoundary, navigate])
	return (
		<main
			className={cn([
				"min-w-[100vw]",
				"min-h-[100vh]",
				"flex",
				"items-center",
				"justify-center",
			])}>
			<Card className={cn(["min-w-[420px]"])}>
				<CardHeader>
					<h1 className={cn(["text-xl", "font-bold"])}>
						{isRouteErrorResponse(error)
							? `${error.status} ${error.statusText}`
							: "Something went wrong"}
					</h1>
				</CardHeader>
				<CardContent>
					{isRouteErrorResponse(error) ? (
						<pre
							className={cn([
								"text-xs",
								"whitespace-pre-wrap",
								"overflow-x-auto",
								"mt-2",
							])}>
							{error.data}
						</pre>
					) : (
						<>
							<p>{error.message}</p>
							<pre
								className={cn([
									"text-xs",
									"whitespace-pre-wrap",
									"overflow-x-auto",
									"mt-2",
								])}>
								{error.stack}
							</pre>
						</>
					)}
				</CardContent>
			</Card>
		</main>
	)
}

export const RootErrorBoundary: React.FC = () => {
	return (
		<ErrorBoundary FallbackComponent={Fallback}>
			<Outlet />
		</ErrorBoundary>
	)
}

export const RouteErrorBoundary: React.FC = () => {
	const error = useRouteError()
	console.error(error)
	return (
		<Fallback
			error={error}
			resetErrorBoundary={() => {
				// noop
			}}
		/>
	)
}
