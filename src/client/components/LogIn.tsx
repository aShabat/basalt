import { FormEvent, useEffect } from "react"
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

  useEffect(() => {
    if (user) navigate("/")
  }, [user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { name, password } = event.currentTarget.elements as FormElements
    const user = await postUserLogin(name.value, password.value)
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

        <button id="submit">LogIn </button>
      </form>
    </div>
  )
}
