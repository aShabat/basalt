import express, { NextFunction, Request, Response } from "express"
import ViteExpress from "vite-express"
import cookieParser from "cookie-parser"

import userRouter from "./routes/user.ts"
import sessionRouter from "./routes/session.ts"
import noteRouter from "./routes/note.ts"
import folderRouter from "./routes/folder.ts"
import { authMiddleware } from "./auth.ts"
import { HttpStatusCode } from "axios"
import { ZodError } from "zod"

const app = express()

app.use((req, _, next) => {
  console.log(req.method, req.path)
  next()
})

app.use(express.json())
app.use(cookieParser())
app.use(authMiddleware)

app.use("/api/session", sessionRouter)
app.use("/api/users", userRouter)
app.use("/api/notes", noteRouter)
app.use("/api/folders", folderRouter)

app.use("/api", (_, res) => {
  res.status(HttpStatusCode.NotFound).json({ error: "not found" })
})

app.use((err: unknown, _: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err)
    return
  }

  if (err instanceof ZodError) {
    res.status(HttpStatusCode.BadRequest).json({
      error: err.issues[0]?.message || "invalid request",
    })
    return
  }

  if (
    typeof err === "object" &&
    err &&
    "code" in err &&
    err.code === "23505"
  ) {
    res.status(HttpStatusCode.Conflict).json({ error: "already exists" })
    return
  }

  console.log(err)
  res
    .status(HttpStatusCode.InternalServerError)
    .json({ error: "internal server error" })
})

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
)
