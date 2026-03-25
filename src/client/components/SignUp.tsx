import { useNavigate } from "react-router"
import { useAppDispatch, useAppSelector } from "../store/store"
import NavigationBar from "./NavigationBar"
import { FormEvent, useEffect } from "react"
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

  useEffect(() => {
    if (user) navigate("/")
  }, [user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { name, password, password_repeat } = event.currentTarget
      .elements as FormElements
    if (password.value !== password_repeat.value) {
      console.log("different passwords")
      return
    }
    const user = await postUserSignup(name.value, password.value)
    if (!user) {
      console.log("didn't login")
      return
    }
    dispatch(login(user))
    navigate("/")
  }
  return (
    <div id="root">
      <NavigationBar />
      <form onSubmit={handleSubmit}>
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
        <button id="submit">LogIn </button>
      </form>
    </div>
  )
}
