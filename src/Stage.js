import { Mobile } from './Mobile.js'
import { Point } from './geom.js'

export let
    ratio = window.devicePixelRatio,
    width = window.innerWidth,
    height = window.innerHeight,
    frame = 0,
    time = 0,
    deltaTime = 1 / 60,
    requestUpdateTimer = 0

export let mouse = new Point().set({ x: width / 2, y: height / 2 })

window.onmousemove = event => {

    let { x, y } = event

    mouse.hasMoved = true
    mouse.setXY(x, y)

}

const ensure = (value, defaultValue = 0) => value === null || value === undefined || (typeof value === 'number' && isNaN(value)) ? defaultValue : value



const CanvasLayerInstances = []

const CanvasDefaultProps = { autoClear: false, autoResetTransform: true }

class CanvasLayer {

    static get(layer) {

        if (typeof layer === 'string') {

            for (let instance of CanvasLayerInstances)
                if (CanvasLayerInstances.id === layer)
                    return instance

            return null

        }

    }

    constructor(props) {

        let { canvas } = props

        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        canvas.width = width * ratio
        canvas.height = height * ratio

        let ctx = canvas.getContext('2d')
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

        Object.assign(this, CanvasDefaultProps, props, { ctx })

    }

    clear() {

        let { ctx, autoResetTransform } = this

        if (autoResetTransform)
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

        ctx.clearRect(0, 0, width, height)

    }

    line(options) {

        let x1 = ensure(options.x1 || options.x, 0)
        let y1 = ensure(options.y1 || options.y, 0)
        let x2 = ensure(options.x2 || options.x, 0)
        let y2 = ensure(options.y2 || options.y, 0)

        let { width = 1 } = options

        let { ctx } = this

        ctx.beginPath()
        ctx.lineWidth = width
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

    }

    circle(options) {

        let { x = 0, y = 0, fill } = options
        let r = ensure(options.r || options.diameter / 2, 5)

        let { ctx } = this

        ctx.beginPath()
        ctx.ellipse(x, y, r, r, 0, 0, 2 * Math.PI)

        if (fill) {

            ctx.fillStyle = fill
            ctx.fill()

        }

    }

    update() {

        let { autoClear } = this

        if (autoClear)
            this.clear()

    }

}

export let layers = {}

export const createLayer = props => {

    let { id, canvas } = props

    if (!canvas)
        canvas = document.querySelector(`canvas#${id}`)

    props.canvas = canvas

    return layers[id] = new CanvasLayer(props)

}

let onUpdateArray = [], onMouseMoveArray = []

function update() {

    requestAnimationFrame(update)

    let aMobileIsDirty = Mobile.instances.some(mobile => mobile.isDirty)

    if (!aMobileIsDirty && requestUpdateTimer > 0 && !mouse.hasMoved)
        return

    for (let layer of Object.values(layers))
        layer.update()

    let array = onUpdateArray
    onUpdateArray = []
    onUpdateArray = array.filter(({ callback }) => callback() !== false).concat(onUpdateArray)

    if (mouse.hasMoved) {

        let array = onMouseMoveArray
        onMouseMoveArray = []
        onMouseMoveArray = array.filter(({ callback }) => callback() !== false).concat(onMouseMoveArray)

        mouse.hasMoved = false

    }

    for (let mobile of Mobile.instances) {

        mobile.update(deltaTime)
        mobile.draw(layers.base && layers.base.ctx, layers.trace && layers.trace.ctx)

    }

    frame++
    time += deltaTime
    requestUpdateTimer += deltaTime

}

export function onUpdate(callback) {

    onUpdateArray.push({ callback })

}

export function onMouseMove(callback) {

    onMouseMoveArray.push({ callback })

}

function requestUpdate(duration = 1) {

    requestUpdateTimer = -duration

}

export const getDirtyProxy = target => {

    let dirty = {

        get: (currentTarget, key) => {

            let currentValue = currentTarget[key]

            return currentValue && typeof currentValue === 'object' ? new Proxy(currentValue, dirty) : currentValue

        },

        set: (currentTarget, key, value) => {

            let currentValue = currentTarget[key]

            if (currentValue === value)
                return true

            target.isDirty = true

            currentTarget[key] = value

            return true

        },

    }

    let proxy = new Proxy(target, dirty)

    return proxy

}

export const getDirtyMobile = (x, y) => getDirtyProxy(new Mobile(x, y))

export default {

    get width() { return width },
    get height() { return height },
    get ratio() { return ratio },
    get frame() { return frame },
    get time() { return time },

    get mouse() { return mouse },
    get layers() { return layers },

    createLayer,

    requestUpdate,
    onUpdate,
    onMouseMove,

    getDirtyProxy,
    getDirtyMobile,

    Mobile,

}

update()
requestUpdate(1)
