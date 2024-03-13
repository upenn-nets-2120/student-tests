import { useSuspenseQuery } from "@tanstack/react-query"

import { useGuardedUser } from "@/lib/user-guard"

type Assignment = string

export const useAssignments = () => {
	const user = useGuardedUser()
	const query = useSuspenseQuery<Assignment[]>({
		queryKey: ["assignments"],
		queryFn: async () => {
			const res = await fetch(
				`${import.meta.env.VITE_API_BASE_URL}/get-collections`,
				{
					headers: {
						Authorization: `${user.token}`,
					},
				}
			)
			const data: string[] = await res.json()
			return data
				.filter((s) => s.startsWith("tests-"))
				.map((s) => s.replace("tests-", ""))
		},
	})
	return query
}

export type Test = {
	_id: string
	name: string
	type: string
	author: string
	timesRan: number
	timesRanSuccessfully: number
	numStudentsRan: number
	numStudentsRanSuccessfully: number
	createdAt: string
	numLiked: number
	numDisliked: number
	userLiked: boolean
	userDisliked: boolean
}

export const useTests = (assignmentId: string) => {
	const user = useGuardedUser()
	const query = useSuspenseQuery<Test[]>({
		queryKey: ["tests", assignmentId],
		queryFn: async () => {
			const res = await fetch(
				`${import.meta.env.VITE_API_BASE_URL}/get-tests/${assignmentId}`,
				{
					headers: {
						Authorization: `${user.token}`,
					},
				}
			)
			return res.json()
		},
	})
	return query
}
