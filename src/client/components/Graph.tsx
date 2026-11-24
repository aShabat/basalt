export interface GraphState {
  x: [number, number][]
  v: [number, number][]
  edges: Edge[]
}

export interface GraphParams {
  edge_k: number
  wall_k: number
  r: number
  dt: number
  lambda: number
  width: number
  height: number
}

export interface Edge {
  from: number
  to: number
  weight: number
}

export interface FixedX {
  i: number
  x: [number, number]
}

const margin = 30
const max_velocity = 25

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function graphParams(width = 900, height = 600): GraphParams {
  return {
    edge_k: 0.02,
    wall_k: 2500,
    r: 110,
    dt: 0.15,
    lambda: 0.88,
    width,
    height,
  }
}

export function graphStep(
  { x, v, edges }: GraphState,
  { edge_k, wall_k, r, dt, lambda, width, height }: GraphParams,
  fixed?: FixedX,
) {
  const a: [number, number][] = Array.from(Array(x.length), (_) => [0, 0])
  for (const { from, to, weight } of edges) {
    const l =
      ((x[from][0] - x[to][0]) ** 2 + (x[from][1] - x[to][1]) ** 2) ** 0.5
    if (!l) continue
    a[from] = [
      a[from][0] - (edge_k * weight * (l - r) * (x[from][0] - x[to][0])) / l,
      a[from][1] - (edge_k * weight * (l - r) * (x[from][1] - x[to][1])) / l,
    ]
    a[to] = [
      a[to][0] - (edge_k * weight * (l - r) * (x[to][0] - x[from][0])) / l,
      a[to][1] - (edge_k * weight * (l - r) * (x[to][1] - x[from][1])) / l,
    ]
  }

  for (let i = 0; i < x.length; i++) {
    if (fixed && i === fixed.i) {
      x[i] = fixed.x
      v[i] = [0, 0]
      continue
    }

    const px = Math.max(1, x[i][0])
    const py = Math.max(1, x[i][1])
    const rx = Math.max(1, width - px)
    const ry = Math.max(1, height - py)

    a[i] = [
      a[i][0] + wall_k / px ** 2 - wall_k / rx ** 2,
      a[i][1] + wall_k / py ** 2 - wall_k / ry ** 2,
    ]

    const vx = clamp(
      lambda * v[i][0] + dt * a[i][0],
      -max_velocity,
      max_velocity,
    )
    const vy = clamp(
      lambda * v[i][1] + dt * a[i][1],
      -max_velocity,
      max_velocity,
    )

    x[i] = [
      clamp(x[i][0] + dt * vx, margin, width - margin),
      clamp(x[i][1] + dt * vy, margin, height - margin),
    ]
    v[i] = [vx, vy]
  }

  return { x, v, edges }
}

export function newGraph(
  length: number,
  width: number,
  height: number,
  edges: Edge[],
) {
  return {
    x: Array.from(Array(length), (_) => [
      margin + Math.random() * (width - margin * 2),
      margin + Math.random() * (height - margin * 2),
    ]),
    v: Array.from(Array(length), (_) => [0, 0]),
    edges,
  } as GraphState
}

function circularGraph(
  length: number,
  width: number,
  height: number,
  edges: Edge[],
) {
  const radius = Math.min(width, height) / 2 - 40
  return {
    x: Array.from(Array(length), (_, index) => {
      const angle = (index / Math.max(length, 1)) * Math.PI * 2
      return [
        width / 2 + Math.cos(angle) * radius,
        height / 2 + Math.sin(angle) * radius,
      ] as [number, number]
    }),
    v: Array.from(Array(length), (_) => [0, 0] as [number, number]),
    edges,
  } as GraphState
}

export function warmUpGraph(
  length: number,
  edges: Edge[],
  width = 900,
  height = 600,
) {
  let state = newGraph(length, width, height, edges)
  const params = graphParams(width, height)

  for (let i = 0; i < 80; i++) {
    state = graphStep(state, params)
  }

  if (state.x.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) {
    return circularGraph(length, width, height, edges)
  }

  return state
}
