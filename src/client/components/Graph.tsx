import { he } from "zod/v4/locales"

interface GraphState {
  x: [number, number][]
  v: [number, number][]
  edges: Edge[]
}

interface GraphParams {
  edge_k: number
  wall_k: number
  r: number
  dt: number
  lambda: number
  width: number
  height: number
}

interface Edge {
  from: number
  to: number
  weight: number
}

interface FixedX {
  i: number
  x: [number, number]
}

function graphStep(
  { x, v, edges }: GraphState,
  { edge_k, wall_k, r, dt, lambda, width, height }: GraphParams,
  fixed?: FixedX,
) {
  const newState: GraphState = { x, v, edges }
  const a: [number, number][] = Array.from(Array(x.length), (_) => [0, 0])
  for (const { from, to, weight } of edges) {
    const l =
      ((x[from][0] - x[to][0]) ** 2 + (x[from][1] - x[to][1]) ** 2) ** 0.5
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
      newState.x[i] = fixed.x
      newState.v[i] = [0, 0]
      continue
    }

    a[i] = [
      a[i][0] + wall_k / x[i][0] ** 2 - wall_k / (width - x[i][0]) ** 2,
      a[i][1] + wall_k / x[i][1] ** 2 - wall_k / (height - x[i][1]) ** 2,
    ]

    newState.x[i] = [x[i][0] + dt * v[i][0], x[i][1] + dt * v[i][1]]
    newState.v[i] = [
      lambda * v[i][0] + dt * a[i][0],
      lambda * v[i][1] + dt * a[i][1],
    ]
  }

  return newState
}

function newGraph(
  length: number,
  width: number,
  height: number,
  edges: Edge[],
) {
  return {
    x: Array.from(Array(length), (_) => [
      Math.random() * width,
      Math.random() * height,
    ]),
    v: Array.from(Array(length), (_) => [0, 0]),
    edges,
  } as GraphState
}
