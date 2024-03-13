import { ChevronRightIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Card, CardHeader } from "@/components/ui/card"
import { useAssignments } from "@/hooks/use-data"
import { cn } from "@/lib/utils"

const AssignmentsPage: React.FC = () => {
	const { data: assignments } = useAssignments()
	return (
		<main>
			<div
				className={cn([
					"flex",
					"items-center",
					"justify-start",
					"gap-4",
					"mb-4",
				])}>
				<h1 className={cn(["text-2xl", "font-bold"])}>Assignments</h1>
				<h1 className={cn(["text-2xl", "text-gray-400"])}>
					{assignments.length}
				</h1>
			</div>
			{assignments.map((assignment) => (
				<Link to={`/assignments/${assignment}`} key={assignment}>
					<Card
						className={cn(["hover:bg-gray-50", "mb-4", "transition-colors"])}>
						<CardHeader>
							<div className={cn(["flex", "items-center", "justify-between"])}>
								<span className={cn(["text-xl"])}>{assignment}</span>
								<ChevronRightIcon className={cn(["h-6", "w-6"])} />
							</div>
						</CardHeader>
					</Card>
				</Link>
			))}
		</main>
	)
}

export default AssignmentsPage
