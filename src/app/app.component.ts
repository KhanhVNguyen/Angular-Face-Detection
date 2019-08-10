import { Component, ViewChild, ElementRef } from '@angular/core';
import * as faceapi from '../libraries/face-api.min.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'face-detection';
  @ViewChild('video', { static: false }) video: ElementRef;

  constructor() {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models')
    ])

  }
  startVideo() {
    var browser = <any>navigator;
    browser.getUserMedia = (browser.getUserMedia ||
      browser.webkitGetUserMedia ||
      browser.mozGetUserMedia ||
      browser.msGetUserMedia);

    browser.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
      this.video.nativeElement.srcObject = stream;
      this.video.nativeElement.play();
    })
  }
}
