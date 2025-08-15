import {
    SSRectangle, SSPolygon, SSPolyline, SSCircle, SSLabel,
    SSLabelOptions, SSPolylineOptions, SSPolygonOptions,
    SSCircleOptions, SSRectangleOptions,
    SSPoint, SSPointOptions
} from "@/lib/cesium/CustomEntity";
import * as Cesium from "cesium";
import Pickr from "@simonwep/pickr";
import '@simonwep/pickr/dist/themes/classic.min.css';
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./entity-editor.html?raw";
import "./entity-editor.scss";

@Component({
    tagName: "czm-entity-editor",
    className: "czm-entity-editor",
    template: Template,
})
class EntityEditor extends BaseWidget {
    // private container: HTMLElement;
    public containerId: string = 'entity-editor-container';
    constructor() {
        super();
    }

    async afterInit(): Promise<void> {
        const container = document.getElementById(this.containerId);
        if (!container) {
            throw new Error(`Container with id ${this.containerId} not found.`);
        }
        this.container = container;
    }

    editEntity(entity: any) {
        this.container.innerHTML = ''; // 清空面板内容
        const form = document.createElement('form');

        if (entity instanceof SSLabel) {
            SSLabelOptions.forEach(option => {
                this.addFieldFromOption(form, option, entity);
            });
        }

        if (entity instanceof SSPolyline) {
            SSPolylineOptions.forEach(option => {
                this.addFieldFromOption(form, option, entity);
            });
        }

        if (entity instanceof SSPolygon) {
            SSPolygonOptions.forEach(option => {
                this.addFieldFromOption(form, option, entity);
            });
        }

        if (entity instanceof SSCircle) {
            SSCircleOptions.forEach(option => {
                this.addFieldFromOption(form, option, entity);
            });
        }

        if (entity instanceof SSRectangle) {
            SSRectangleOptions.forEach(option => {
                this.addFieldFromOption(form, option, entity);
            });
        }

        if (entity instanceof SSPoint) {
            SSPointOptions.forEach(option => {
                this.addFieldFromOption(form, option, entity);
            });
        }

        this.container.appendChild(form);
    }

    private addFieldFromOption(form: HTMLElement, option: any, entity: any) {
        const fieldContainer = document.createElement('div');
        const fieldLabel = document.createElement('label');
        fieldLabel.classList.add('form-label');
        fieldLabel.textContent = option.name;
        fieldContainer.appendChild(fieldLabel);

        if (option.type === 'color') {
            const input = document.createElement('input');
            fieldContainer.appendChild(input);
            input.type = 'color';
            input.value = entity[option.key].toCssColorString();
            const pickr = new Pickr({
                el: input,
                theme: 'classic',
                default: entity[option.key].toCssColorString(),
                swatches: [],
                components: {
                    preview: true,
                    opacity: true,
                    hue: true,
                    interaction: {
                        hex: true,
                        rgba: true,
                        hsla: false,
                        hsva: false,
                        cmyk: false,
                        input: true,
                        clear: false,
                        save: false
                    }
                }
            });
            pickr.on('change', (color: any) => {
                entity[option.key] = Cesium.Color.fromCssColorString(color.toHEXA().toString());
            });

        }

        else if (option.type === 'string' || option.type === 'number') {
            const input = document.createElement('input');
            input.type = option.type === 'color' ? 'color' : 'text';
            input.value = option.type === 'color' ? entity[option.key].toCssColorString() : entity[option.key];
            console.log(option.key, entity[option.key]);
            input.addEventListener('input', (event) => {
                const value = (event.target as HTMLInputElement).value;
                if (option.type === 'number') {
                    entity[option.key] = parseFloat(value);
                } else if (option.type === 'color') {
                    entity[option.key] = Cesium.Color.fromCssColorString(value);
                } else {
                    entity[option.key] = value;
                }
            });
            fieldContainer.appendChild(input);
        } else if (option.type === 'select') {
            const select = document.createElement('select');
            option.options.forEach((opt: any) => {
                const optionElement = document.createElement('option');
                optionElement.value = opt.value;
                optionElement.textContent = opt.name.toString();
                if (entity[option.key].value === opt) {
                    optionElement.selected = true;
                }
                select.appendChild(optionElement);
            });
            select.addEventListener('change', (event) => {
                const value = (event.target as HTMLSelectElement).value;
                console.log(value, parseInt(value, 10), option.key, entity[option.key]);
                entity[option.key] = parseInt(value, 10);
            });
            fieldContainer.appendChild(select);
        } else if (option.type === 'boolean') {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.role = 'switch';
            fieldContainer.classList.add('form-check', 'form-switch');
            checkbox.classList.add('form-check-input')
            checkbox.checked = entity[option.key];
            checkbox.addEventListener('change', (event) => {
                const value = (event.target as HTMLInputElement).checked;
                entity[option.key] = value;
            });
            fieldContainer.appendChild(checkbox);
        }

        form.appendChild(fieldContainer);
    }
}

export default EntityEditor;
