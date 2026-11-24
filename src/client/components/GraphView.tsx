import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import { useLocation, useNavigate } from "react-router"
import { Graph, GraphNode } from "../../schemas/types"
import { getGraph, getUser } from "../api"
import { decodePath, encodePath } from "../paths"
import {
  GraphState,
  graphParams,
  graphStep,
  warmUpGraph,
} from "./Graph"

interface Props {
  name: string
  onOpen: () => void
}

interface View {
  x: number
  y: number
  scale: number
}

interface Drag {
  kind: "node" | "pan"
  startClient: [number, number]
  startView: View
  moved: boolean
  index?: number
  point?: [number, number]
}

const width = 900
const height = 600
const params = graphParams(width, height)

export default function ({ name, onOpen }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const svgRef = useRef<SVGSVGElement>(null)
  const stateRef = useRef<GraphState | undefined>(undefined)
  const dragRef = useRef<Drag | undefined>(undefined)
  const [graph, setGraph] = useState<Graph>()
  const [error, setError] = useState("")
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 })
  const [frame, setFrame] = useState(0)
  const activePath = decodePath(location.pathname)

  useEffect(() => {
    ;(async () => {
      setError("")
      setGraph(undefined)
      try {
        const user = await getUser({ name })
        setGraph(await getGraph(user.id))
      } catch (err) {
        setError(err instanceof Error ? err.message : "couldn't load graph")
      }
    })()
  }, [name])

  useEffect(() => {
    dragRef.current = undefined
    setView({ x: 0, y: 0, scale: 1 })
    if (!graph) {
      stateRef.current = undefined
      return
    }
    stateRef.current = warmUpGraph(
      graph.nodes.length,
      graph.edges,
      width,
      height,
    )
    setFrame((value) => value + 1)
  }, [graph])

  useEffect(() => {
    if (!graph || !graph.nodes.length) return
    let animation = 0
    let previous = 0

    function tick(now: number) {
      if (!previous) previous = now
      const elapsed = Math.min(3, Math.max(1, (now - previous) / 16.67))
      previous = now

      if (!document.hidden && stateRef.current) {
        const drag = dragRef.current
        const fixed =
          drag?.kind === "node" && drag.index !== undefined && drag.point
            ? { i: drag.index, x: drag.point }
            : undefined
        const steps = Math.min(3, Math.max(1, Math.round(elapsed)))
        for (let i = 0; i < steps; i++) {
          graphStep(stateRef.current, params, fixed)
        }
        setFrame((value) => value + 1)
      }

      animation = requestAnimationFrame(tick)
    }

    animation = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animation)
  }, [graph])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    function onWheel(event: WheelEvent) {
      event.preventDefault()
      const point = svgPoint(event.clientX, event.clientY)
      if (!point) return

      setView((current) => {
        const scale = Math.max(
          0.5,
          Math.min(3, current.scale * (event.deltaY < 0 ? 1.1 : 0.9)),
        )
        const worldX = (point[0] - current.x) / current.scale
        const worldY = (point[1] - current.y) / current.scale
        return {
          scale,
          x: point[0] - worldX * scale,
          y: point[1] - worldY * scale,
        }
      })
    }

    svg.addEventListener("wheel", onWheel, { passive: false })
    return () => svg.removeEventListener("wheel", onWheel)
  }, [graph])

  function svgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    return [
      (clientX - rect.left) * (width / rect.width),
      (clientY - rect.top) * (height / rect.height),
    ] as [number, number]
  }

  function worldPoint(clientX: number, clientY: number) {
    const point = svgPoint(clientX, clientY)
    if (!point) return
    return [
      (point[0] - view.x) / view.scale,
      (point[1] - view.y) / view.scale,
    ] as [number, number]
  }

  function openNode(node: GraphNode) {
    if (node.unresolved) return
    onOpen()
    navigate(encodePath(node.path))
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return
    dragRef.current = {
      kind: "pan",
      startClient: [event.clientX, event.clientY],
      startView: view,
      moved: false,
    }
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  function handleNodeDown(
    index: number,
    event: ReactPointerEvent<SVGGElement>,
  ) {
    event.stopPropagation()
    event.preventDefault()
    if (event.button !== 0) return
    const point = worldPoint(event.clientX, event.clientY)
    if (!point) return
    dragRef.current = {
      kind: "node",
      startClient: [event.clientX, event.clientY],
      startView: view,
      moved: false,
      index,
      point,
    }
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    if (!drag) return

    if (
      Math.abs(event.clientX - drag.startClient[0]) > 4 ||
      Math.abs(event.clientY - drag.startClient[1]) > 4
    ) {
      drag.moved = true
    }

    if (drag.kind === "node") {
      const point = worldPoint(event.clientX, event.clientY)
      if (point) drag.point = point
      return
    }

    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const dx = (event.clientX - drag.startClient[0]) * (width / rect.width)
    const dy = (event.clientY - drag.startClient[1]) * (height / rect.height)
    setView({
      ...drag.startView,
      x: drag.startView.x + dx,
      y: drag.startView.y + dy,
    })
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    dragRef.current = undefined
    svgRef.current?.releasePointerCapture(event.pointerId)

    if (drag?.kind === "node" && !drag.moved && drag.index !== undefined) {
      const node = graph?.nodes[drag.index]
      if (node) openNode(node)
    }
  }

  function handlePointerCancel(event: ReactPointerEvent<SVGSVGElement>) {
    dragRef.current = undefined
    svgRef.current?.releasePointerCapture(event.pointerId)
  }

  function resetView() {
    setView({ x: 0, y: 0, scale: 1 })
    if (!graph) return
    stateRef.current = warmUpGraph(
      graph.nodes.length,
      graph.edges,
      width,
      height,
    )
    setFrame((value) => value + 1)
  }

  if (error) return <div className="error"> {error} </div>
  if (!graph) return <div className="empty_note">loading graph</div>
  if (!graph.nodes.length) {
    return <div className="empty_note">no notes to graph yet</div>
  }

  const state = stateRef.current
  if (!state) return <div className="empty_note">loading graph</div>

  return (
    <div className="graph_view" data-frame={frame}>
      <div className="graph_toolbar">
        <button type="button" onClick={resetView}>
          reset view
        </button>
      </div>
      <svg
        ref={svgRef}
        className="graph_svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {graph.edges.map((edge) => {
            const from = state.x[edge.from]
            const to = state.x[edge.to]
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from[0]}
                y1={from[1]}
                x2={to[0]}
                y2={to[1]}
                strokeWidth={Math.min(4, 1 + edge.weight * 0.5)}
              />
            )
          })}
          {graph.nodes.map((node, index) => {
            const [x, y] = state.x[index]
            const active = node.path === activePath
            return (
              <g
                key={node.path}
                className={[
                  "graph_node",
                  node.unresolved ? "unresolved" : "",
                  active ? "active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onPointerDown={(event) => handleNodeDown(index, event)}
              >
                <circle cx={x} cy={y} r={10} />
                <text x={x + 14} y={y + 4}>
                  {node.title.length > 30
                    ? `${node.title.slice(0, 30)}...`
                    : node.title}
                </text>
                <title>{node.title}</title>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
