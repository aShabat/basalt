import { configureStore } from "@reduxjs/toolkit"
import auth from "./auth.ts"

const store = configureStore({
  reducer: {
    auth: auth,
  },
})

export default store
