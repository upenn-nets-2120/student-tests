export class UserStateNullError extends Error {
	constructor() {
		super("User state not found")
	}
}
