import {
	HomeIcon,
	LogOutIcon,
	LucideIcon,
	NotebookTextIcon,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { useAssignments } from "@/hooks/use-data"
import { useUserStore } from "@/lib/store"
import { useGuardedUser } from "@/lib/user-guard"
import { cn } from "@/lib/utils"

interface NavProps {
	links: {
		title: string
		to: string
		label?: string
		icon: LucideIcon
	}[]
}

const NavContent: React.FC<NavProps> = ({ links }) => {
	const location = useLocation()
	return (
		<div className="group flex flex-col gap-4 py-2">
			<nav className="grid gap-2">
				{links.map((link, index) => (
					<Link
						key={index}
						to={link.to}
						className={cn(
							buttonVariants({
								variant: location.pathname === link.to ? "secondary" : "ghost",
							}),
							"justify-start"
						)}>
						<link.icon className="mr-2 h-4 w-4" />
						{link.title}
						{link.label && <span className={cn("ml-auto")}>{link.label}</span>}
					</Link>
				))}
			</nav>
		</div>
	)
}

const $Nav: React.FC = () => {
	const { data: assignments } = useAssignments()
	return (
		<NavContent
			links={[
				{
					title: "Home",
					to: "/",
					icon: HomeIcon,
				},
				{
					title: "Assignments",
					to: "/assignments",
					icon: NotebookTextIcon,
					label: assignments.length.toString(),
				},
			]}
		/>
	)
}

const Sidebar: React.FC = () => {
	const user = useGuardedUser()
	const { resetUser } = useUserStore()
	return (
		<div>
			<Card className={cn(["w-64", "sticky", "top-4"])}>
				<CardHeader className={cn(["flex", "flex-col", "gap-1"])}>
					<div className={cn(["flex", "items-center", "gap-4"])}>
						<Avatar>
							<AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
						</Avatar>
						<div className={cn(["flex", "flex-col", "gap-1"])}>
							<div
								className={cn([
									"font-bold",
									"text-xs",
									"leading-none",
									user.admin ? "text-pink-500" : "text-blue-500",
								])}>
								{user.admin ? "ADMIN" : "STUDENT"}
							</div>
							<div className={cn(["font-bold", "text-lg", "leading-none"])}>
								{user.username}
							</div>
							<div className={cn(["text-xs", "text-gray-400"])}>{user.id}</div>
						</div>
					</div>
					<Button
						className={cn("w-full")}
						variant="outline"
						onClick={() => {
							resetUser()
						}}>
						<LogOutIcon className="mr-2 h-4 w-4" />
						Sign Out
					</Button>
				</CardHeader>
				<CardContent className={cn(["p-4"])}>
					<$Nav />
				</CardContent>
				<CardFooter>
					<div className={cn(["text-xs", "text-gray-400"])}>
						Made with ⚡️ by esinx
					</div>
				</CardFooter>
			</Card>
		</div>
	)
}

export default Sidebar
