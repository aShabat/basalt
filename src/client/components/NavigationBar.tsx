import { Link } from "react-router"
import { useAppDispatch, useAppSelector } from "../store/store"
import { deleteLogout } from "../api"
import { logout } from "../store/auth"
import { useState } from "react"

export default function () {
  const user = useAppSelector(({ auth }) => auth.user)
  const dispatch = useAppDispatch()
  const [error, setError] = useState("")

  async function handleSignOut() {
    setError("")
    try {
      await deleteLogout()
      dispatch(logout())
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't sign out")
    }
  }
  return (
    <div>
      {user ? (
        <>
          <Link to={`/${user.name}`}>profile</Link>
          <a onClick={handleSignOut}> signout </a>
        </>
      ) : (
        <>
          <Link to="/login">login</Link> <Link to="/signup">signup</Link>
        </>
      )}
      <a
        href="https://github.com/aShabat/basalt_di_final"
        target="_blank"
        rel="noreferrer"
      >
        <img
          className="github_icon"
          src="/github-mark.svg"
          alt=""
          aria-hidden="true"
        />
        github
      </a>
      {error && <span> {error} </span>}
    </div>
  )
}
