import { ChangeEvent, FormEvent, useState } from "react"

interface Props {
  name?: string
  handleInput: Function
  handleCancel: Function
}

export default function ({ name, handleInput, handleCancel }: Props) {
  const [value, setValue] = useState("")

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    handleInput(value)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
  }

  return (
    <form onSubmit={onSubmit}>
      <input name={name} value={value} onChange={onChange} />
      <button type="submit"> Ok </button>
      <button type="button" onClick={() => handleCancel()}>
        Cancel
      </button>
    </form>
  )
}
