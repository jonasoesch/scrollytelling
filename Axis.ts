import * as d3 from "d3"
import {AxisDefinition, AnnotationDefinition, Named} from "./Definitions"
import {Annotation} from "./Annotation"
import {Design} from "./Design"
import {buildMapWithName, valOrDefault, throwIfNotSet} from "./Helpers"


export abstract class Axis {
    _annotations:Map<string, Annotation>
    _scale:any
    _name:string
    _stage:d3.Selection<any, any, any, any>
    _field:string
    axis:d3.Axis<any>
    position:string
    ticks:any[]
    tickFormat:string

    width:number
    height:number
    design:Design

    constructor(axis:AxisDefinition, 
        stage:d3.Selection<any,any,any,any>, 
        width:number, 
        height:number,
        design:Design) {
        this.stage = stage
        this.width = width
        this.height = height
        this.field = axis.field
        this.ticks = valOrDefault(axis.ticks, null)
        this.tickFormat = valOrDefault(axis.tickFormat, null)
        this.design = design
        this.buildAxis(axis) 
    }

    buildAxis(axis:AxisDefinition) {
        this.name = valOrDefault(axis.name, "This axis is unnamed")
        this.scale = this.defineScale(axis.domain)
        this.annotations = this.buildAnnotations(valOrDefault(axis.annotations, []))
    }


    buildAnnotations(annotations:AnnotationDefinition[]){
        return buildMapWithName(annotations, this.buildAnnotation) 
    }

    buildAnnotation(anno:AnnotationDefinition) {
        return new Annotation(anno) 
    }

    abstract defineScale(domain:any):any
    abstract getAxis(scale:any, ticks?:any):d3.Axis<any>
    abstract draw():void
    abstract translate():string


    drawAnnotations() {
        this.annotations.forEach(a => this.drawAnnotation(a)) 
    }
    abstract drawAnnotation(a:Annotation):void

    protected annotationPosition(pos:(string|number)):number {
        if(pos === "start") {pos = 0}
        if(pos === "end") {pos = 1}
        if(typeof(pos) === "string") {pos = 0} // Users mistake
        return pos
    }


    set annotations(annos:Map<string, Annotation>) {this._annotations = annos}
    get annotations() {return this._annotations}
    set scale(scale:d3.AxisScale<any>) {this._scale = scale}
    get scale() {return this._scale}
    set name(name:string) {this._name = name}
    get name() {return this._name}
    set stage(stage:d3.Selection<any, any, any,any>) {this._stage = stage}
    get stage() {return this._stage}
    get field() {return this._field}
    set field(name:string) {this._field = name}
}
