import { cn } from "@/lib/utils"

const Header: React.FC = () => {
	return (
		<div className={cn(["py-12"])}>
			<h1 className={cn(["text-3xl", "font-black"])}>Student Test Framework</h1>
		</div>
	)
}

export default Header
