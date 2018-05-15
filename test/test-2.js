import Stage from '../src/Stage.js'
import Mobile from '../src/Mobile.js'
import { Point } from '../src/geom.js'

let { width, height, mouse } = Stage

let now = () => performance.now() / 1000
let mix = (a, b, x, clamp = true) => a + (b - a) * (clamp ? (x < 0 ? 0 : x > 1 ? 1 : x) : x)

let graph = Stage.createLayer({ id: 'graph', autoClear: false })
let bg = Stage.createLayer({ id: 'bg', autoClear: false })
let base = Stage.createLayer({ id: 'base', autoClear: true })

let target = new Mobile({ x: 100, y: height / 2, color: 'red' })
let mobile = new Mobile({ x: 150, y: height / 2 })

bg.line({ x1: 0, x2: width, y: height / 2 })

Stage.onMouseMove(() => {

    Stage.requestUpdate()

    let { x } = Stage.mouse

    base.clear()
    base.line({ x, y1: 0, y2: height / 2 })
    base.circle({ x, y: height / 2, r: 3, fill: 'black' })

})



window.onclick = () => {

    Stage.requestUpdate()

    target.position.x = Stage.mouse.x

    let start = { t: now(), p: mobile.position.x }
    let end = { p: Stage.mouse.x }
    let v0 = mobile.velocity.x

    let distance = Math.abs(mobile.position.x - Stage.mouse.x)
    let phase = Mobile.resolvePhase({ distance, v0, v1: 0, a0: 1000, a1: -500 })

    Object.assign(mobile, {

        start,
        end,
        phase,

    })

}

Stage.onUpdate(() => {

    let { phase, start, end } = mobile

    if (phase) {

        Stage.requestUpdate()

        let dt = now() - start.t

        let integration = Mobile.integratePhase({ phase, dt })

        let direction = start.p < end.p ? 1 : -1
        let x = mix(start.p, end.p, integration.distance / phase.distance)

        mobile.position.x = x
        mobile.velocity.x = integration.velocity * direction

        graph.clear()
        graph.ctx.translate(start.p, 100)
        graph.ctx.scale(direction, 1)

        Mobile.drawPhase({ ctx: graph.ctx, width: phase.distance, height: (height / 2) - 100 }, phase)

        if (dt > phase.time)
            Object.assign(mobile, { phase: null })

    }

})



export {

    mix,
    base,
    Stage,
    Mobile,

    bg,
    graph,
    mobile,

}
