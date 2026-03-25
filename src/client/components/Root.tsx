import { useNavigate } from "react-router"
import { useAppSelector } from "../store/store"
import { useEffect } from "react"

export default function () {
  const navigate = useNavigate()
  const user = useAppSelector(({ auth }) => auth.user)
  useEffect(() => {
    if (user) navigate(`/${user.name}`)
    else navigate("/signup")
  })
  return <div />
}
