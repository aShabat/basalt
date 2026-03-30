import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { User } from "../../schemas/types"
import zod from "zod"

const storeUser = User.omit({ date_added: true })
type storeUser = zod.infer<typeof storeUser>
interface AuthState {
  user?: storeUser
}

const initialState: AuthState = {}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<storeUser>) {
      state.user = storeUser.parse(action.payload)
    },

    logout(state) {
      state.user = undefined
    },
  },
})

export const { login, logout } = authSlice.actions

export default authSlice.reducer
