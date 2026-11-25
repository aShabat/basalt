import express, { NextFunction, Request, Response } from "express"
import cookieParser from "cookie-parser"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import userRouter from "./routes/user.ts"
import sessionRouter from "./routes/session.ts"
import noteRouter from "./routes/note.ts"
import folderRouter from "./routes/folder.ts"
import { authMiddleware } from "./auth.ts"
import { HttpStatusCode } from "axios"
import { ZodError } from "zod"
import config from "../config.ts"

const app = express()
const port = config.port
const production = process.env.NODE_ENV === "production"

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

if (production) {
  const dist = fileURLToPath(new URL("../../dist/", import.meta.url))
  const index = path.join(dist, "index.html")

  if (!fs.existsSync(index)) {
    console.log("dist/index.html not found; run npm run build")
  }

  app.use(express.static(dist))
  app.use((req, res, next) => {
    if (req.method !== "GET") {
      next()
      return
    }
    res.sendFile(index, (err) => {
      if (err) next(err)
    })
  })
}

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

if (production) {
  app.listen(port, () =>
    console.log(`Server is listening on port ${port}...`),
  )
} else {
  const { default: ViteExpress } = await import("vite-express")
  ViteExpress.listen(app, port, () =>
    console.log(`Server is listening on port ${port}...`),
  )
}
