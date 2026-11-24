export function userPath(name: string) {
  return `/${name}`
}

export function childPath(base: string, title: string) {
  return `${base}/${title}`
}

export function replacePathPrefix(
  path: string,
  old_prefix: string,
  new_prefix: string,
) {
  if (path === old_prefix) return new_prefix
  if (path.startsWith(`${old_prefix}/`))
    return `${new_prefix}${path.slice(old_prefix.length)}`
  return path
}

export function isUnderPath(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`)
}
