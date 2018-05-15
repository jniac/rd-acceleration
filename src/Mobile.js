import { Point } from './geom.js'

function resolveDt0(distance, v0, v1, a0, a1) {

	let k = 1 - a0 / a1

	let a = a0 * k / 2
	let b = v0 * k
	let c = (v1 * v1 - v0 * v0) / a1 / 2 - distance

	let discriminant = b * b - 4 * a * c

	let dt0 = (-b + Math.sqrt(discriminant)) / a / 2
	let dt1 = (-b - Math.sqrt(discriminant)) / a / 2

	return dt0
}

function resolveTime(distance, velocity, acceleration, epsilon = 1e-9) {

    if (acceleration === 0) {

        let t = distance / velocity

        return t < 0 ? NaN : t

    }

	/*
	    b^2 - 4ac
	    a = acceleration / 2
	    b = velocity
	    c = -distance
	*/
    let discriminant = (velocity * velocity) + 2 * acceleration * distance

	// WARNING: quite weak, what value for epsilon ?
	if (Math.abs(discriminant) < epsilon)
		discriminant = 0

    if (discriminant < 0)
        return NaN

    discriminant = Math.sqrt(discriminant)

    let t1 = (-velocity + discriminant) / acceleration
    let t2 = (-velocity - discriminant) / acceleration

    return t1 >= 0 ? t1 : t2 >= 0 ? t2 : NaN

}

export const EPSILON = 1e-14
export const epsilonRound = x => Math.abs(x) < EPSILON ? 0 : x

function resolvePhase({ distance, v0, v1 = 0, a0, a1 }) {

    let dt0 = epsilonRound( resolveDt0(distance, v0, v1, a0, a1) )
    let d0 = v0 * dt0 + a0 * dt0 * dt0 / 2
    let vmax = v0 + a0 * dt0
    let d1 = distance - d0
    let dt1 = resolveTime(d1, vmax, a1)
    let time = dt0 + dt1

    return { time, dt0, dt1, distance, d0, d1, v0, v1, vmax, a0, a1 }

}

function integratePhase({ phase, dt }) {

	if (phase.time === undefined)
        phase = resolvePhase(phase)

	let { time, dt0, dt1, distance, d0, d1, v0, v1, vmax, a0, a1 } = phase

	if (dt >= time)
		return { distance: distance + v1 * (dt - time), velocity: v1, phase }

	if (dt <= dt0)
		return { distance: v0 * dt + a0 * dt * dt / 2, velocity: v0 + a0 * dt, phase }

	dt = dt - dt0

	return { distance: d0 + vmax * dt + a1 * dt * dt / 2, velocity: vmax + a1 * dt, phase }

}



// context utils

function path({ ctx }, ...coords) {

    for (let i = 0, n = coords.length; i < n; i += 2) {

        i === 0
            ? ctx.moveTo(coords[i], coords[i + 1])
            : ctx.lineTo(coords[i], coords[i + 1])

    }

}

function innerRect({ ctx, lineWidth = 1 }, x, y, width, height) {

	ctx.lineWidth = lineWidth
	ctx.rect(x + lineWidth / 2, y + lineWidth / 2, width - lineWidth, height - lineWidth)

}

function drawPhase({ ctx, x = 0, y = 0, width = 400, height = 200 }, phase) {

	if (phase.time === undefined)
        phase = resolvePhase(phase)

    let { time, dt0, dt1, distance, d0, d1, v0, v1, vmax, a0, a1 } = phase

    ctx.beginPath()
    ctx.fillStyle = '#0001'
    ctx.rect(x, y, width, height)
    ctx.fill()

    ctx.beginPath()
	ctx.strokeStyle = '#f30f'
	ctx.fillStyle = '#f306'
	innerRect({ ctx }, x, y + height * (1 - v0 / vmax), width * dt0 / time, height * v0 / vmax)
    ctx.stroke()
	ctx.fill()

    ctx.beginPath()
	ctx.fillStyle = '#f30f'
    path({ ctx }, x, y + height * (1 - v0 / vmax), x + width * dt0 / time, y + height * (1 - v0 / vmax), x + width * dt0 / time, y)
    ctx.fill()

	ctx.beginPath()
	ctx.strokeStyle = '#f30f'
	ctx.fillStyle = '#f306'
	innerRect({ ctx }, x + width * dt0 / time, y + height * (1 - v1 / vmax), width * dt1 / time, height * v1 / vmax)
    ctx.stroke()
	ctx.fill()

    ctx.beginPath()
	ctx.fillStyle = '#f30f'
    path({ ctx },
		x + width * dt0 / time, y + height * (1 - v1 / vmax),
		x + width * dt0 / time, y,
		x + width, y + height * (1 - v1 / vmax))
    ctx.fill()

	ctx.beginPath()
	ctx.strokeStyle = '#000'
	ctx.lineWidth = 2

	let array = []

	for (let i = 0; i <= width; i++) {

		array[i * 2] = x + i
		array[i * 2 + 1] = y + height * (1 - Mobile.integratePhase({ phase, dt: time * i / width }).distance / distance)

	}

	path({ ctx }, ...array)
	ctx.stroke()


	return phase

}

export class Mobile {

    constructor({ x = 0, y = 0, color = 'black' }) {

        Object.assign(this, {

            uid: Mobile.uid++,

            position: new Point(x, y),
            velocity: new Point(0, 0),
            acceleration: new Point(0, 0),

			color,

			onUpdateArray: [],

            isDirty: false,

        })

        Mobile.instances.push(this)

    }

    draw(ctx, traceCtx) {

		let { color } = this
        let { x, y } = this.position

		this.drawCircle({ ctx, r: 10, stroke: 2 })

		if (traceCtx)
			this.drawCircle({ ctx: traceCtx, r: 1 })

        return this

    }

	drawCircle({ ctx, r = 3, stroke = null, x = this.position.x, y = this.position.y, color = this.color }) {

		if (!ctx)
			return

		ctx.beginPath()

		if (stroke)
			ctx.lineWidth = stroke

		stroke
			? ctx.strokeStyle = color
			: ctx.fillStyle = color

		ctx.ellipse(x, y, r, r, 0, 0, 2 * Math.PI)
		ctx.closePath()

		stroke
			? ctx.stroke()
			: ctx.fill()

	}

	onUpdate(callback) {

		this.onUpdateArray.push({ callback })

	}

    update(dt) {

        let { x:px, y:py } = this.position
        let { x:vx, y:vy } = this.velocity
        let { x:ax, y:ay } = this.acceleration

        px += vx * dt + ax * dt * dt / 2
        py += vy * dt + ay * dt * dt / 2

        vx += ax * dt
        vy += ay * dt

        this.position.set(px, py)
        this.velocity.set(vx, vy)

        this.isDirty = false

		let array = this.onUpdateArray
	    this.onUpdateArray = []
	    this.onUpdateArray = array.filter(({ callback }) => callback() !== false).concat(this.onUpdateArray)

        return this

    }

}

Object.assign(Mobile, {

    instances: [],
    uid: 0,

	epsilonRound,

    resolveDt0,
    resolveTime,
    resolvePhase,
	integratePhase,
    drawPhase,

})

export default Mobile
