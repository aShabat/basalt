import { marked, Token } from "marked"
import { prepareLinks } from "../markdown.ts"

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
  marked.walkTokens(marked.lexer(prepareLinks(content)), (token: Token) => {
    if (token.type !== "link") return
    const href = (token as { href?: string }).href
    if (!href) return
    const path = normalizeTarget(href)
    if (path) links.add(path)
  })
  return [...links]
}
