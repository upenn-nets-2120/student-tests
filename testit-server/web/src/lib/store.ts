import { z } from "zod"
import { create } from "zustand"
import { persist } from "zustand/middleware"

const userSchema = z.object({
	id: z.string(),
	token: z.string(),
	username: z.string(),
	admin: z.boolean(),
})

type User = z.infer<typeof userSchema>

type UserStoreState = {
	user: User | null
}

type UserStoreAction = {
	setUser: (user: User) => void
	resetUser: () => void
}

type UserStore = UserStoreState & UserStoreAction

export const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			user: (() => {
				const data = localStorage.getItem("user")
				if (!data) return null
				const res = userSchema.safeParse(JSON.parse(data))
				return res.success ? res.data : null
			})(),
			setUser: (user) => set({ user }),
			resetUser: () => set({ user: null }),
		}),
		{
			name: "edu.upenn.seas.nets2120.student-testing-framework",
		}
	)
)
