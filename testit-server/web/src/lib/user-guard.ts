import { UserStateNullError } from "@/lib/error"
import { useUserStore } from "@/lib/store"

export const useGuardedUser = () => {
	const { user } = useUserStore()
	if (!user) {
		throw new UserStateNullError()
	}
	return user
}
