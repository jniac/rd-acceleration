
export class CanvasLayer {

    constructor(canvas) {

        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        canvas.width = width * ratio
        canvas.height = height * ratio

        let ctx = canvas.getContext('2d')
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

        Object.assign(this, {

            canvas,
            ctx,

        })

    }

    clear() {

        this.ctx.clearRect(0, 0, width, height)

    }

}
