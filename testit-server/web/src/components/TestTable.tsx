import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table"

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Test } from "@/hooks/use-data"

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
		accessorKey: "numLiked",
		header: "Likes",
	},
	{
		accessorKey: "numDisliked",
		header: "Dislikes",
	},
]

type TestTableProps = {
	tests: Test[]
}

export const TestTable: React.FC<TestTableProps> = ({ tests }) => {
	const table = useReactTable({
		data: tests,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})
	return (
		<Table>
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => {
							return (
								<TableHead key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(
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
	)
}
