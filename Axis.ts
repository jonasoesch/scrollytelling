import * as d3 from "d3"
import {AxisDefinition, AnnotationDefinition, Named} from "./Definitions"
import {Annotation} from "./Annotation"
import {Design} from "./Design"


export abstract class Axis {
    _annotations:Map<string, Annotation>
    _scale:any
    _name:string
    _stage:d3.Selection<any, any, any, any>

    width:number
    height:number
    design:Design

    constructor(axis:AxisDefinition, 
        stage:d3.Selection<any,any,any,any>, 
        width:number, 
        height:number) {
        this.stage = stage
        this.width = width
        this.height = height
        this.buildAxis(axis) 
    }

    buildAxis(axis:AxisDefinition) {
        this.name = this.valOrDefault(axis.name, "This axis is unnamed")
        this.scale = this.defineScale(axis.domain)
        this.annotations = this.buildAnnotations(this.valOrDefault(axis.annotations, []))
    }


    buildAnnotations(annotations:AnnotationDefinition[]){
        console.log(annotations)
        return this.buildMapWithName(annotations, this.buildAnnotation) 
    }

    buildAnnotation(anno:AnnotationDefinition) {
        return new Annotation(anno) 
    }

    abstract defineScale(domain:any):any
    abstract draw():void

    // ========= Helper methods ==========
    buildMapWithName(list:Named[], buildMethod:Function):Map<string, any> {
        let m = new Map()
        list.forEach( (item:Named) => {
            m.set(item.name, buildMethod(item)) 
        })
        return m
    }

    throwIfNotSet<T>(value:T, msg:string):T {
        if(value === null || value === undefined) {
            throw new Error(msg) 
        }
        return value
    }

    valOrDefault<T>(value:T, deflt:T):T {
        if(value === null || value == undefined) {return deflt} 
        else {return value}
    }

    set annotations(annos:Map<string, Annotation>) {this._annotations = annos}
    set scale(scale:d3.AxisScale<any>) {this._scale = scale}
    get scale() {return this._scale}
    set name(name:string) {this._name = name}
    get name() {return this._name}
    set stage(stage:d3.Selection<any, any, any,any>) {this._stage = stage}
    get stage() {return this._stage}
}
