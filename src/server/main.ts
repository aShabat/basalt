import express, { NextFunction, Request, Response } from "express"
import ViteExpress from "vite-express"
import cookieParser from "cookie-parser"

import userRouter from "./routes/user.ts"
import noteRouter from "./routes/note.ts"
import folderRouter from "./routes/folder.ts"
import { authMiddleware } from "./auth.ts"
import { HttpStatusCode } from "axios"

const app = express()

app.use((req, _, next) => {
  console.log(req.method, req.path)
  next()
})

app.use(express.json())
app.use(cookieParser())
app.use(authMiddleware)

app.use("/api/user", userRouter)

declare global {
  namespace Express {
    interface Request {
      path_user_id?: number
    }
  }
}
function insertUserId(req: Request, res: Response, next: NextFunction) {
  const user_id = +req.params.user_id
  if (!user_id) {
    res.status(HttpStatusCode.BadRequest).send("user_id has to be a number")
    return
  }
  req.path_user_id = user_id
  next()
}

app.use("/api/note/:user_id", [insertUserId, noteRouter])
app.use("/api/folder/:user_id", [insertUserId, folderRouter])

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
)
