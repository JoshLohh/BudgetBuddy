import { useUser } from "@/hooks/useUser"
import { useRouter } from "expo-router"
import { useEffect, ReactNode } from "react"
import ThemedLoader from "../ThemedLoader"

type UserOnlyProps = {
  children: ReactNode
}

const UserOnly = ({ children }: UserOnlyProps) => {
    const { user, authChecked } = useUser()
    const router = useRouter()

    useEffect(() => {
        if (authChecked && user == null) {
            router.replace('/login')
        } 
    }, [user, authChecked])

    if (!authChecked || !user) {
        return (
            <ThemedLoader />
        )
    }

    return children
}

export default UserOnly