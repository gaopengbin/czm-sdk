import { Modal } from "bootstrap";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./record-screen.html?raw";
import "./record-screen.scss";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

@Component({
    tagName: "czm-record-screen",
    className: "czm-record-screen",
    template: Template,
})
export default class RecordScreen extends BaseWidget {
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];

    constructor() {
        super();
    }

    async onInit() {
        this.$data = {
            recording: false,
            videoUrl: '',
            saveName: 'recording',
        };
    }

    async startRecording() {
        this.$data.recording = true;
        this.forceRefresh();
        this.recordedChunks = [];

        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        this.mediaRecorder = new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/mp4' });
            this.$data.videoUrl = URL.createObjectURL(blob);
            this.forceRefresh();
        };

        this.mediaRecorder.start();
    }

    stopRecording() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
        this.$data.recording = false;
        this.forceRefresh();
    }

    showSaveModal() {
        const saveModal = new Modal(document.getElementById('saveModal') as any);
        this.saveModel = saveModal;
        saveModal.show();
    }

    downloadRecording() {
        const a = document.createElement('a');
        a.href = this.$data.videoUrl;
        a.download = `${this.$data.saveName}.mp4`;
        a.click();
        this.saveModel.hide();
    }
}
