import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"
import { createContext, PropsWithChildren, useContext } from "react"
import { toast } from "sonner"

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Test } from "@/hooks/use-data"
import { useGuardedUser } from "@/lib/user-guard"
import { cn } from "@/lib/utils"

const TestTableContext = createContext<{ assignmentId: string } | null>(null)

const TestTableContextProvider: React.FC<
	PropsWithChildren<{ assignmentId: string }>
> = ({ assignmentId, children }) => {
	return (
		<TestTableContext.Provider value={{ assignmentId }}>
			{children}
		</TestTableContext.Provider>
	)
}

export const useTestTableContext = () => {
	const context = useContext(TestTableContext)
	if (!context) {
		throw new Error(
			"useTestTableContext must be used within a TestTableContextProvider"
		)
	}
	return context
}

const TestLikeActionCell: React.FC<{
	test: Test
}> = ({ test }) => {
	const user = useGuardedUser()
	const { assignmentId } = useTestTableContext()
	const queryClient = useQueryClient()
	const { mutateAsync: likeTest } = useMutation<void, void, boolean>({
		mutationFn: async (flag) => {
			const res = await fetch(
				`${import.meta.env.VITE_API_BASE_URL}/${
					flag ? "like" : "dislike"
				}-test/${assignmentId}/${test._id}`,
				{
					method: "POST",
					headers: {
						Authorization: `${user.token}`,
					},
				}
			)
			const text = await res.text()
			if (text.includes("success")) {
				toast.success(`Test ${flag ? "liked" : "disliked"}`, {
					description: test.name,
				})
			} else if (text.includes("already")) {
				toast.error(`Test already ${flag ? "liked" : "disliked"}`, {
					description: test.name,
				})
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ["tests", assignmentId],
			})
		},
	})
	return (
		<div className={cn(["flex", "items-center", "justify-center", "gap-4"])}>
			<span
				className={cn([
					"flex",
					"flex-col",
					"items-center",
					"justify-center",
					"text-xs",
					test.userLiked ? "text-blue-400" : "text-gray-400",
					"hover:cursor-pointer",
				])}
				onClick={() => likeTest(true)}>
				<ThumbsUpIcon className={cn(["h-4", "w-4"])} />
				<span className={cn(["tabular-nums", "font-bold"])}>
					{test.numLiked}
				</span>
			</span>
			<span
				className={cn([
					"flex",
					"flex-col",
					"items-center",
					"justify-center",
					"text-xs",
					test.userDisliked ? "text-red-400" : "text-gray-400",
					"hover:pointer",
					"hover:cursor-pointer",
				])}
				onClick={() => likeTest(false)}>
				<ThumbsDownIcon className={cn(["h-4", "w-4"])} />
				<span className={cn(["tabular-nums", "font-bold"])}>
					{test.numDisliked}
				</span>
			</span>
		</div>
	)
}

export const columns: ColumnDef<Test>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "type",
		header: "Type",
	},
	{
		accessorKey: "author",
		header: "Author",
	},
	{
		accessorKey: "timesRan",
		header: "Times Ran",
	},
	{
		accessorKey: "timesRanSuccessfully",
		header: "Successful Runs",
	},
	{
		accessorKey: "numStudentsRan",
		header: "# of Students Ran",
	},
	{
		accessorKey: "numStudentsRanSuccessfully",
		header: "# of Students Ran Successfully",
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row }) => {
			return <TestLikeActionCell test={row.original} />
		},
	},
]

type TestTableProps = {
	assignmentId: string
	tests: Test[]
}

export const TestTable: React.FC<TestTableProps> = ({
	assignmentId,
	tests,
}) => {
	const table = useReactTable({
		data: tests,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})
	return (
		<TestTableContextProvider assignmentId={assignmentId}>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{!header.isPlaceholder &&
											flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
									</TableHead>
								)
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</TestTableContextProvider>
	)
}
