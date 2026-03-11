import jwt from "jsonwebtoken"
import type { NextFunction, Response, Request } from "express"
import config from "../config.ts"
import { User } from "../schemas/types.ts"

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export function sign(user: User) {
  return jwt.sign(user, config.jwt_key, { expiresIn: 3 * 24 * 60 * 60 })
}

export function verify(token: string) {
  try {
    return User.parse(jwt.verify(token, config.jwt_key))
  } catch (err) {
    return undefined
  }
}

export function authMiddleware(req: Request, _: Response, next: NextFunction) {
  const token = req.cookies["AuthToken"]
  req.user = verify(token)
  next()
}
