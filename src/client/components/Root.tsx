import { Navigate } from "react-router"
import { useAppSelector } from "../store/store"

export default function () {
  const user = useAppSelector(({ auth }) => auth.user)
  return <Navigate to={user ? `/${user.name}` : "/signup"} replace />
}
