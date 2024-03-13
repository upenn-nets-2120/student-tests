import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useUserStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const FormSchema = z.object({
	username: z.string().min(2, {
		message: "PennKey must be at least 2 characters long",
	}),
	password: z.string().min(8, {
		message: "Password must be at least 8 characters long",
	}),
})

const LoginPage: React.FC = () => {
	const navigate = useNavigate()
	const { setUser } = useUserStore()

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	})

	const onSubmit = useCallback<SubmitHandler<z.infer<typeof FormSchema>>>(
		async (data) => {
			try {
				const response = await fetch(
					`${import.meta.env.VITE_API_BASE_URL}/login`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(data),
					}
				)
				if (!response.ok) {
					const reason = await response.text()
					toast.error("Login Failed", {
						important: true,
						description: reason,
					})
				} else {
					const data = await response.json()
					if (typeof data.token === "string") {
						setUser(data)
						toast.success("Login Successful", {
							important: true,
							description: `Welcome back, ${data.username}!`,
						})
						navigate("/")
					} else {
						toast.error("Login Failed", {
							important: true,
						})
					}
				}
			} catch (error) {
				toast.error("Login Failed", {
					important: true,
					description: "An unexpected error occurred",
				})
			}
		},
		[]
	)

	return (
		<div
			className={cn([
				"min-w-[100vw]",
				"min-h-[100vh]",
				"flex",
				"items-center",
				"justify-center",
			])}>
			<div className={cn(["max-w-[600px]", "flex-1"])}>
				<Card>
					<CardHeader>
						<h1 className={cn(["text-2xl", "font-black"])}>Login</h1>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6">
								<FormField
									control={form.control}
									name="username"
									render={({ field }) => (
										<FormItem>
											<FormLabel>PennKey</FormLabel>
											<FormControl>
												<Input placeholder="nets2120" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Password</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder="12345678"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												This is your 8-digit Penn ID
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button type="submit">Login</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default LoginPage
