import { Mobile } from './Mobile.js'

export let
    ratio = window.devicePixelRatio,
    width = window.innerWidth,
    height = window.innerHeight,
    frame = 0,
    time = 0,
    deltaTime = 1 / 60,
    requestUpdateTimer = 0

class CanvasLayer {

    constructor(props) {

        let { canvas } = props

        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        canvas.width = width * ratio
        canvas.height = height * ratio

        let ctx = canvas.getContext('2d')
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

        Object.assign(this, props, {

            ctx,

        })

    }

    clear() {

        this.ctx.clearRect(0, 0, width, height)

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

    props = Object.assign({ canvas, autoClear: true }, props)

    layers[id] = new CanvasLayer(props)

}

let onUpdateArray = []

function update() {

    requestAnimationFrame(update)

    let aMobileIsDirty = Mobile.instances.some(mobile => mobile.isDirty)

    if (!aMobileIsDirty && requestUpdateTimer > 0)
        return

    let array = onUpdateArray
    onUpdateArray = []
    onUpdateArray = array.filter(({ callback }) => callback() !== false).concat(onUpdateArray)

    for (let layer of Object.values(layers))
        layer.update()

    for (let mobile of Mobile.instances)
        mobile.update(deltaTime).draw(layers.base.ctx, layers.trace.ctx)

    frame++
    time += deltaTime
    requestUpdateTimer += deltaTime

}

export function onUpdate(callback) {

    onUpdateArray.push({ callback })

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

    get layers() { return layers },

    createLayer,

    requestUpdate,
    onUpdate,

    getDirtyProxy,
    getDirtyMobile,

    Mobile,

}

update()
requestUpdate(1)
