import { useNavigate } from "react-router"
import { useAppDispatch, useAppSelector } from "../store/store"
import NavigationBar from "./NavigationBar"
import { FormEvent, useEffect, useState } from "react"
import { postUserSignup } from "../api"
import { login } from "../store/auth"

interface FormElements extends HTMLFormControlsCollection {
  name: HTMLInputElement
  password: HTMLInputElement
  password_repeat: HTMLInputElement
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
    const { name, password, password_repeat } = event.currentTarget
      .elements as FormElements
    if (password.value !== password_repeat.value) {
      setError("passwords don't match")
      return
    }
    setPending(true)
    try {
      const user = await postUserSignup(name.value, password.value)
      dispatch(login(user))
      navigate("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't sign up")
    } finally {
      setPending(false)
    }
  }
  return (
    <div id="root">
      <NavigationBar />
      {error && <div className="error"> {error} </div>}
      <form className="authForm" onSubmit={handleSubmit}>
        <label htmlFor="name_input"> Name: </label>
        <input name="name" id="name_input" />

        <label htmlFor="password_input"> Password: </label>
        <input type="password" name="password" id="password_input" />

        <label htmlFor="password_repeat_input"> Repeat password: </label>
        <input
          type="password"
          name="password_repeat"
          id="password_repeat_input"
        />
        <button id="submit" disabled={pending}>
          {pending ? "Signing up..." : "SignUp"}
        </button>
      </form>
    </div>
  )
}
