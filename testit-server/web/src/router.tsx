import { createBrowserRouter } from "react-router-dom"

import { RouteErrorBoundary } from "@/components/RootErrorBoundary"
import AuthenticatedLayout from "@/layout/AuthenticatedLayout"
import AssignmentsPage from "@/pages/AssignmentsPage"
import IndexPage from "@/pages/IndexPage"
import LoginPage from "@/pages/Login"
import TestsPage from "@/pages/TestsPage"

const router = createBrowserRouter([
	{
		ErrorBoundary: RouteErrorBoundary,
		hasErrorBoundary: true,
		children: [
			{
				path: "/login",
				element: <LoginPage />,
			},
			{
				element: <AuthenticatedLayout />,
				children: [
					{
						path: "/",
						element: <IndexPage />,
					},
					{
						path: "/assignments",
						element: <AssignmentsPage />,
					},
					{
						path: "/assignments/:assignmentId",
						element: <TestsPage />,
					},
				],
			},
		],
	},
])

export default router
