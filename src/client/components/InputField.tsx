import { ChangeEvent, FormEvent, useState } from "react"

interface Props {
  name?: string
  initialValue?: string
  handleInput: Function
  handleCancel: Function
}

export default function ({
  name,
  initialValue,
  handleInput,
  handleCancel,
}: Props) {
  const [value, setValue] = useState(initialValue || "")

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
