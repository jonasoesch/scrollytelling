import * as d3 from 'd3'
import {Logger} from './Logger'
import {Drawable} from './Drawable'
import {MorphingChart} from "./MorphingChart"
import {FadingChart} from "./FadingChart"
import {StepDefinition} from "./Definitions"


export abstract class Director {
    storyboard:Step[] = []
    timer:Date = new Date()
    logTimer:Date = new Date()
    lastScrollTop:number
    logger:Logger
    name:string


    constructor(stepDefs:StepDefinition[], name:string) {
        this.lastScrollTop = window.scrollY;
        this.logger = new Logger()
        this.name = name

        this.storyboard = this.buildSteps(stepDefs)

        // Checks if 
        if (window.requestAnimationFrame) {
            try {
                this.loop();
            } catch(e) {
                this.logger.error("An unspecified error has occured")
            }
        }
        // Send log every 5 seconds
        setInterval(() => this.save(), 5 * 1000);

        // Initialize
        d3.select("body").style("height", this.pageHeight())
        this.drawAll(window.scrollY)
        //setInterval(() => this.alive(), 20 * 1000)
    }


    get storyLength() {
        let len =  this.storyboard[this.storyboard.length-1].from
        if (len < 0) {
            return 0
        } else {
            return len
        }
    }
    pageHeight():number {
        if (this.storyLength < 0) {
            return window.innerHeight 
        } else {
            return this.storyLength + window.innerHeight + window.innerHeight * 2 / 3
        }
    }

    get absolutePosition() {
        return this.lastScrollTop / this.storyLength
    }


    /**
     * The draw-loop: Redraws the screen if the reader
     * has scrolled
     **/
    private loop() {
        var scrollTop = window.scrollY;
        if (this.lastScrollTop === scrollTop) {
            // It's faster to fire on each `animationFrame` instead of listening to the `onScroll`-event.
            window.requestAnimationFrame(() => this.loop());
            return;
        } else {
            this.lastScrollTop = scrollTop;

            // fire scroll function if scrolls vertically
            this.scrolling(scrollTop);
            window.requestAnimationFrame(() => this.loop());
        }
    } 



    /**
     * This method is called whenever a "scroll" is being detected and 
     * the scroll position passed.
     **/
    public scrolling(scroll:number) {

        let t = new Date()
        let difference = t.getTime() - this.timer.getTime()
        let logTimerDiff = t.getTime() - this.logTimer.getTime()

        // only execute if the last execution has
        // been more than x ms ago
        // TODO: Does this work?
        if(difference>10) {
            this.timer = t
            this.drawAll(scroll)
        }
    }

    /**
     * Draws every drawable in the storyboard that should
     * currently be visible. Hides all the others.
     **/
    public abstract drawAll(offset:number):void


        private buildSteps(stepDefs:StepDefinition[]) {
            return stepDefs.map( (stepDef) => {
                return {
                    from: stepDef.from,
                    to: stepDef.to,
                    draw: stepDef.draw
                }
            }) 
        }


    /**
     * This method transforms the global scroll position
     * to a percent value representing how far into the transition
     * the reader is.
     **/
    protected howFar(step:Step, offset:number):number {
        let stepSize = step.to-step.from
        let intoStep = offset - step.from

        if(stepSize < 0) {throw new Error("End is before start")}
        if(intoStep < 0) {throw new Error("Position is not between end and start")}

        return this.easing(intoStep/stepSize)
    }

    /**
     * The easing-method wraps `howFar` to allow the application of
     * different easing functions.
     **/
    easing(howFar:number){
        return d3.easePolyInOut(howFar) 
    }

    private save() {
        this.logger.send()
    }

    private alive() {
        this.logger.alive()
        this.logger.send() 
    }

    /**
     * Checks if a Drawable is a MorphingChart or a FadingChart.
     * If yes, calls `atPoint()` and passes the relative position (calculated in
     * the `howFar()`-method). Then it draws the `Drawable`.
     **/
    protected abstract draw(chart:Drawable, howFar:number):void

        hide(chart:Drawable) {
            chart.hide() 
        }


    /**
     * Returns the storyboard in human-readable form
     **/
    public toString():string {
        let out = ""
        this.storyboard.forEach(step => {
            out = out + step.from + "–"
            out = out + step.to + ": "
            out = out + step.draw.name + "\n"
        })
        return out
    }

}


export class SuperposedDirector extends Director {

    public drawAll(offset:number) {
        this.storyboard.forEach( (step) => this.hide(step.draw) )
        this.storyboard.forEach( (step) => {
            if (offset > step.from && offset <= step.to) {
                this.draw(step.draw, this.howFar(step, offset)) 
            }
        })
    }

    protected draw(chart:Drawable, howFar:number) {
        this.logger.animation(chart.name, howFar, this.absolutePosition)
        if(chart instanceof MorphingChart || chart instanceof FadingChart) {
            chart.atPosition(howFar).draw() 
        } else {
            chart.draw() 
        }

    }
}


interface Step {
    from:number
    to:number
    draw:Drawable
}

export class JuxtaposedDirector extends Director {

    public drawAll(offset:number) {
        //this.storyboard.forEach( (step) => this.hide(step.draw) )
        this.storyboard.forEach( (step) => {
            if (offset > step.to) {
                this.drawChart(step.draw) 
                this.hideMorphingChart(step.draw)
            }
            if (offset > step.from && offset <= step.to) {
                this.draw(step.draw, this.howFar(step, offset)) 
            }
            if(offset < step.from) {
                this.drawChartScene(step.draw)
                this.hideMorphingChart(step.draw)
            }
        })
    }


    protected draw(chart:Drawable, howFar:number) {
        this.logger.animation(chart.name, howFar, this.absolutePosition)
        if(chart instanceof MorphingChart || chart instanceof FadingChart) {
            chart.atPosition(howFar).drawCharacters() 
        } else {
            chart.draw() 
        }
    }

    protected drawChart(chart:Drawable) {
        if(!(chart instanceof MorphingChart) && !(chart instanceof FadingChart)) {
            chart.draw() 
        }
    }


    protected drawChartScene(chart:Drawable) {
        if(!(chart instanceof MorphingChart) && !(chart instanceof FadingChart)) {
            chart.hideCharacters()
            chart.drawScene() 
        }
    }
    protected drawMorphingChart(chart:Drawable, howFar:number) {
        this.logger.animation(chart.name, howFar, this.absolutePosition)
        if(chart instanceof MorphingChart || chart instanceof FadingChart) {
            chart.atPosition(howFar).drawCharacters() 
        }
    }

    protected hideMorphingChart(chart:Drawable) {
        if(chart instanceof MorphingChart || chart instanceof FadingChart) {
            chart.hide()
        }
    }
}
