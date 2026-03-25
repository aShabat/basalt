import { Link, useNavigate } from "react-router"
import { useAppSelector } from "../store/store"
import { deleteLogout } from "../api"

export default function () {
  const user = useAppSelector(({ auth }) => auth.user)
  const navigate = useNavigate()

  async function handleSignOut() {
    await deleteLogout()
    navigate("/")
  }
  return (
    <div>
      {user ? (
        <a onClick={handleSignOut}> signout </a>
      ) : (
        <>
          <Link to="/login">login</Link> <Link to="/signup">signup</Link>
        </>
      )}
    </div>
  )
}
