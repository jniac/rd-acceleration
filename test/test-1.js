import Stage from '../src/Stage.js'
import Mobile from '../src/Mobile.js'
import { Point } from '../src/geom.js'

let { width, height } = Stage

export {

    Stage,
    Mobile,
    Point,

}

export let mouse = new Point().set({ x: width / 2, y: height / 2 })
export let m1 = Stage.getDirtyMobile({ x: width / 2, y: height / 2 })
export let m2 = Stage.getDirtyMobile({ x: 100, y: 100 })
export let m3 = Stage.getDirtyMobile({ x: 140, y: 140, color: '#f20' })

// m2.velocity.x = 100

Stage.onUpdate(() => {

    document.querySelector('span.frame').innerHTML = Stage.frame
    document.querySelector('span.time').innerHTML = Stage.time.toFixed(2)

    let deltaTime = 1 / 60
    let v = Point.sub(mouse, m3.position)
    let distance = v.length
    let v0 = m3.velocity.length
    let phase = { distance, v0, v1: 0, a0: 2000, a1: -1000 }
    let integration = Mobile.integratePhase({ phase, dt: deltaTime })
    m3.velocity.copy(v)
    m3.velocity.normalize(integration.velocity)

    // if (integration.phase.dt0 > 0 && integration.phase.dt0 < deltaTime)
    if (v0 < integration.velocity)
        m3.drawCircle({ ctx: Stage.layers.trace.ctx, r: 2 })

})

Stage.requestUpdate(2)

window.onmousemove = event => {

    let { x, y } = event

    mouse.setXY(x, y)

    Object.assign(m1.position, { x, y })

    Stage.requestUpdate(3)

}

let phase = Mobile.drawPhase({ ctx: Stage.layers.trace.ctx, x: 100, y: 300 }, { distance: 100, v0: 50, v1: 10, a0: 200, a1: -100 })
Mobile.drawPhase({ ctx: Stage.layers.trace.ctx, x: 100, y: 510 }, { distance: 100, v0: 0, v1: 0, a0: 500, a1: -2000 })

{

    // let distance = 100, timeMax = 1, deltaTime = 1 / 60
    let distance = 200, timeMax = 2, deltaTime = 1 / 60

    let phase = { distance, v0: 50, v1: 10, a0: 100, a1: -150 }

    console.log(Mobile.resolvePhase(phase))
    console.log({ timeMax })
    console.log(Mobile.integratePhase({ phase, dt: timeMax }))

    {
        let position = 0, velocity = 50

        let control = { frame: 0, time: 0, acc: 0, decc: 0 }

        while (true) {

            let integration = Mobile.integratePhase({ phase: { ...phase, distance: distance  - position, v0: velocity }, dt: deltaTime })

            if (integration.phase.dt0 > 0)
                control.acc++

            if (deltaTime > integration.phase.dt0)
                control.decc++

            control.frame++

            position += integration.distance
            velocity = integration.velocity

            control.time += deltaTime

            let check = Mobile.integratePhase({ phase, dt: control.time })

            // console.log({ velocity, velocityCheck: check.velocity })

            // console.log(time.toFixed(4), { position, velocity })
            // console.log(time.toFixed(4), Mobile.resolvePhase(phase).dt0)

            if (control.frame >= Math.round(timeMax / deltaTime))
                break

        }

        console.log({ position, velocity })
        console.log(control)

    }

}
