import { FormEvent, useEffect, useState } from "react"
import NavigationBar from "./NavigationBar"
import { postUserLogin } from "../api"
import { useAppDispatch, useAppSelector } from "../store/store"
import { login } from "../store/auth"
import { useNavigate } from "react-router"

interface FormElements extends HTMLFormControlsCollection {
  name: HTMLInputElement
  password: HTMLInputElement
}

export default function () {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(({ auth }) => auth.user)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (user) navigate("/")
  }, [user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setPending(true)
    const { name, password } = event.currentTarget.elements as FormElements
    try {
      const user = await postUserLogin(name.value, password.value)
      dispatch(login(user))
      navigate("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't log in")
    } finally {
      setPending(false)
    }
  }
  return (
    <div id="root">
      <NavigationBar />
      {error && <div> {error} </div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="name_input"> Name: </label>
        <input name="name" id="name_input" />

        <label htmlFor="password_input"> Password: </label>
        <input type="password" name="password" id="password_input" />

        <button id="submit" disabled={pending}>
          {pending ? "Logging in..." : "LogIn"}
        </button>
      </form>
    </div>
  )
}
