import { useParams } from "react-router-dom"

import { TestTable } from "@/components/TestTable"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useTests } from "@/hooks/use-data"
import { cn } from "@/lib/utils"

const TestsPage: React.FC = () => {
	const params = useParams()
	const { assignmentId } = params
	if (typeof assignmentId !== "string")
		throw new Error("assignmentId is required")

	const { data: tests } = useTests(assignmentId)

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
				<h1 className={cn(["text-2xl", "font-bold"])}>{assignmentId}</h1>
				<h1 className={cn(["text-2xl", "text-gray-400"])}>{tests.length}</h1>
			</div>
			<Card>
				<CardHeader>
					<h1 className={cn(["text-2xl", "font-bold"])}>Tests</h1>
				</CardHeader>
				<CardContent>
					<TestTable assignmentId={assignmentId} tests={tests} />
				</CardContent>
			</Card>
		</main>
	)
}

export default TestsPage
