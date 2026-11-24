export interface LinkMatch {
  start: number
  end: number
  target: string
}

export interface BareLinkMatch {
  start: number
  end: number
  target: string
}

export interface SplitTarget {
  path: string
  suffix: string
  angle: boolean
}

const codePatterns = [/```[\s\S]*?```/g, /~~~[\s\S]*?~~~/g, /`[^`\n]*`/g]

function codeRanges(content: string) {
  const ranges: [number, number][] = []
  for (const pattern of codePatterns) {
    for (const match of content.matchAll(pattern)) {
      ranges.push([match.index!, match.index! + match[0].length])
    }
  }
  return ranges
}

function insideRanges(index: number, ranges: [number, number][]) {
  return ranges.some(([start, end]) => index >= start && index < end)
}

export function splitTarget(target: string): SplitTarget {
  if (target.startsWith("<") && target.endsWith(">")) {
    return { path: target.slice(1, -1), suffix: "", angle: true }
  }

  const title = target.match(/^(.*?)(\s+"[^"]*")$/)
  if (title) return { path: title[1], suffix: title[2], angle: false }

  const hash = target.indexOf("#")
  if (hash !== -1) {
    return { path: target.slice(0, hash), suffix: target.slice(hash), angle: false }
  }

  return { path: target, suffix: "", angle: false }
}

export function scanLinks(content: string) {
  const found: LinkMatch[] = []
  const ranges = codeRanges(content)
  let index = 0

  while ((index = content.indexOf("](", index)) !== -1) {
    const start = index + 2

    if (insideRanges(index, ranges)) {
      index = start
      continue
    }

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

  return found
}

export function scanBareLinks(content: string) {
  const found: BareLinkMatch[] = []
  const ranges = codeRanges(content)
  let index = 0

  while ((index = content.indexOf("(", index)) !== -1) {
    if (index > 0 && content[index - 1] === "]") {
      index++
      continue
    }
    if (insideRanges(index, ranges)) {
      index++
      continue
    }

    let depth = 1
    let i = index + 1

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
    const target = content.slice(index + 1, i)
    if (target.startsWith("/")) {
      found.push({ start: index + 1, end: i, target })
    }
    index = i + 1
  }

  return found
}

function escapeLabel(value: string) {
  return value.replaceAll("[", "\\[").replaceAll("]", "\\]")
}

export function prepareLinks(content: string) {
  let prepared = content
  for (const link of scanLinks(content).reverse()) {
    const { path, suffix, angle } = splitTarget(link.target)
    if (angle) continue
    const next = `${path.replaceAll(" ", "%20")}${suffix}`
    prepared =
      prepared.slice(0, link.start) + next + prepared.slice(link.end)
  }

  for (const link of scanBareLinks(prepared).reverse()) {
    const { path, suffix } = splitTarget(link.target)
    const label = escapeLabel(path)
    const next = `[${label}](${encodeURI(path)}${suffix})`
    prepared =
      prepared.slice(0, link.start - 1) + next + prepared.slice(link.end + 1)
  }

  return prepared
}

export function rewriteLinks(content: string, mapping: Map<string, string>) {
  const matches = [
    ...scanLinks(content).map((link) => ({ ...link, bare: false })),
    ...scanBareLinks(content).map((link) => ({ ...link, bare: true })),
  ].sort((a, b) => b.start - a.start)

  let count = 0
  let rewritten = content

  for (const link of matches) {
    const { path, suffix, angle } = splitTarget(link.target)
    const replacement = mapping.get(path)
    if (!replacement) continue
    count++
    const next = link.bare
      ? `${replacement}${suffix}`
      : angle
        ? `<${replacement}${suffix}>`
        : `${replacement}${suffix}`
    rewritten =
      rewritten.slice(0, link.start) + next + rewritten.slice(link.end)
  }

  return { content: rewritten, count }
}
