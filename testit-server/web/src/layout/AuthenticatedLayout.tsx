import React from "react"
import { Outlet } from "react-router-dom"

import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const SuspenseFallback: React.FC = () => (
	<div className="flex flex-col space-y-3">
		<Skeleton className="h-12 w-96 rounded-xl" />
		<Skeleton className="h-[125px] w-full rounded-xl" />
		<Skeleton className="h-[125px] w-full rounded-xl" />
		<Skeleton className="h-[125px] w-full rounded-xl" />
		<Skeleton className="h-[125px] w-full rounded-xl" />
	</div>
)

const AuthenticatedLayout: React.FC = () => {
	return (
		<div className={cn(["min-w-[100vw]", "min-h-[100vh]", "p-4"])}>
			<Header />
			<div className={cn(["flex"])}>
				<Sidebar />
				<main className={cn(["flex-1", "px-4", "pb-4"])}>
					<React.Suspense fallback={<SuspenseFallback />}>
						<Outlet />
					</React.Suspense>
				</main>
			</div>
		</div>
	)
}

export default AuthenticatedLayout
