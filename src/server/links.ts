import { marked, Token } from "marked"

function splitTarget(target: string) {
  const index = target.search(/[#\s]/)
  if (index === -1) return { path: target, suffix: "" }
  return { path: target.slice(0, index), suffix: target.slice(index) }
}

function normalizeTarget(href: string) {
  if (!href.startsWith("/")) return
  const path = href.split(/[?#]/)[0]
  if (!path || path === "/") return
  try {
    return decodeURI(path)
  } catch {
    return path
  }
}

export function extractLinks(content: string) {
  const links = new Set<string>()
  marked.walkTokens(marked.lexer(content), (token: Token) => {
    if (token.type !== "link") return
    const href = (token as { href?: string }).href
    if (!href) return
    const path = normalizeTarget(href)
    if (path) links.add(path)
  })
  return [...links]
}

export function rewriteLinks(content: string, mapping: Map<string, string>) {
  const found: { start: number; end: number; target: string }[] = []
  let index = 0

  while ((index = content.indexOf("](", index)) !== -1) {
    const start = index + 2
    let depth = 1
    let i = start

    while (i < content.length && depth > 0) {
      const char = content[i]
      if (char === "\\") {
        i += 2
        continue
      }
      if (char === "(") depth++
      if (char === ")") depth--
      if (depth === 0) break
      i++
    }

    if (depth !== 0) break
    found.push({ start, end: i, target: content.slice(start, i) })
    index = i + 1
  }

  let count = 0
  let rewritten = content
  for (const link of found.reverse()) {
    const { path, suffix } = splitTarget(link.target)
    const replacement = mapping.get(path)
    if (!replacement) continue
    count++
    rewritten =
      rewritten.slice(0, link.start) +
      `${replacement}${suffix}` +
      rewritten.slice(link.end)
  }

  return { content: rewritten, count }
}
