import React from "react"
import ReactDOM from "react-dom/client"

import "./main.css"

import { BrowserRouter } from "react-router"
import App from "./components/App"
import { Provider } from "react-redux"
import { store } from "./store/store"
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
)
