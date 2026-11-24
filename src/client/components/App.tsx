import { useEffect } from "react"
import { getUser } from "../api"
import { login } from "../store/auth"
import { useAppDispatch } from "../store/store"
import { Route, Routes } from "react-router"
import LogIn from "./LogIn"
import SignUp from "./SignUp"
import Root from "./Root"
import NoteViewer from "./NoteViewer"

export default function () {
  const dispatch = useAppDispatch()
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const user = await getUser()
        if (active && user) dispatch(login(user))
      } catch {}
    })()
    return () => {
      active = false
    }
  }, [dispatch])
  return (
    <div>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/:name/*" element={<NoteViewer />} />
      </Routes>
    </div>
  )
}
