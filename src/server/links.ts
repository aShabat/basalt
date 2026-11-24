const linkRexp = /\]\(([^()]+)\)/g

function splitTarget(target: string) {
  const index = target.search(/[#\s]/)
  if (index === -1) return { path: target, suffix: "" }
  return { path: target.slice(0, index), suffix: target.slice(index) }
}

export function extractLinks(content: string) {
  return [...content.matchAll(linkRexp)].map(
    (match) => splitTarget(match[1]).path,
  )
}

export function rewriteLinks(content: string, mapping: Map<string, string>) {
  let count = 0
  const rewritten = content.replace(linkRexp, (match, target: string) => {
    const { path, suffix } = splitTarget(target)
    const replacement = mapping.get(path)
    if (!replacement) return match
    count++
    return `](${replacement}${suffix})`
  })
  return { content: rewritten, count }
}
