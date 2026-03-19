import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { User } from "../../schemas/types"

interface AuthState {
  user?: User
}

const initialState: AuthState = {}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<User>) {
      state.user = action.payload
    },

    logout(state) {
      state.user = undefined
    },
  },
})

export const { login, logout } = authSlice.actions

export default authSlice.reducer
