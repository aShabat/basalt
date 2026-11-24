import bcrypt from "bcrypt"
import { HttpStatusCode } from "axios"
import { Router } from "express"
import { LogIn } from "../../schemas/api.ts"
import { User } from "../../schemas/types.ts"
import { sign } from "../auth.ts"
import { getUserByName } from "../models/users.ts"

const router = Router()

router.post("/", async (req, res) => {
  const { name, password } = LogIn.parse(req.body)
  const user = await getUserByName(name)
  if (!user) {
    res
      .status(HttpStatusCode.Unauthorized)
      .send("wrong name or password")
    return
  }

  const password_matched = await bcrypt.compare(
    password,
    user.encrypted_password,
  )
  if (!password_matched) {
    res
      .status(HttpStatusCode.Unauthorized)
      .send("wrong name or password")
    return
  }

  const token = sign(user)
  res.cookie("AuthToken", token, { httpOnly: true, sameSite: "lax" })
  res.status(HttpStatusCode.Ok).json(User.parse(user))
})

router.delete("/", async (_, res) => {
  res.clearCookie("AuthToken").sendStatus(HttpStatusCode.NoContent)
})

export default router
