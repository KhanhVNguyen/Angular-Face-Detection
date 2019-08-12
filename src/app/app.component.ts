import { Component, ViewChild, ElementRef, HostListener, ViewEncapsulation, AfterViewInit, OnInit } from '@angular/core';
import * as faceapi from 'face-api.js';
import { setInterval } from 'timers';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnInit {
  title = 'face-detection';
  @ViewChild('videoElement', { static: false }) videoElement: ElementRef;
  @ViewChild('imageUpload', { static: false }) imageUpload: ElementRef;
  imgSrc = '';
  video: any;

  constructor() {
    const MODEL = '/assets/models';
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL)
    ]).then(() => this.startVideo())
  }

  ngOnInit() {

    // this.loadVideoModel();
  }

  loadVideoModel() {
    const MODEL = '/assets/vid_models';
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL)
    ]).then(() => this.startVideo())
  }

  loadImageModel() {
    const MODEL = '/assets/img_models';
    Promise.all([
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL)
    ])
  }

  startVideo() {
    this.video = this.videoElement.nativeElement;

    var browser = <any>navigator;
    browser.getUserMedia = (browser.getUserMedia ||
      browser.webkitGetUserMedia ||
      browser.mozGetUserMedia ||
      browser.msGetUserMedia);
    navigator.getUserMedia(
      { video: true, audio: false },
      stream => {
        this.video.srcObject = stream;
        this.video.addEventListener('play', this.onplay())
      },
      err => console.error(err)
    )
    // browser.mediaDevices.getUserMedia({ video: true, audio: false }).then(async stream => {
    //   that.video.srcObject = stream;
    //   this.video.addEventListener('play', this.onplay.bind(this))
    // })
  }

  ngAfterViewInit() {
    // this.video = this.videoElement.nativeElement;
    // this.video.addEventListener('play', this.onplay())
  }

  onplay() {
    setTimeout(async () => {

      const labeledFaceDescriptors = await this.loadLabeledImages();
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
      let canvas;
      setInterval(async () => {
        // if(canvas) canvas.remove()
        if (!canvas) canvas = faceapi.createCanvasFromMedia(this.video);
        document.body.append(canvas);
        const displaySize = { width: this.video.width, height: this.video.height };
        faceapi.matchDimensions(canvas, displaySize);
        let detections = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors().withFaceExpressions()
        // console.log(detections)
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

        results.forEach((result, i) => {
          const box = resizedDetections[i].detection.box
          const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
          console.log(drawBox);

          drawBox.draw(canvas)
        })

        // canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        // faceapi.draw.drawDetections(canvas, resizedDetections)
        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
      }, 100)
    }, 3000)
  }

  @HostListener('change')
  async onInputChange() {
    const container = document.createElement('div')
    container.style.position = 'relative'
    document.body.append(container)
    const labeledFaceDescriptors = await this.loadLabeledImages()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    let image
    let canvas
    document.body.append('Loaded')
    setTimeout(async () => {
      if (image) image.remove()
      if (canvas) canvas.remove()
      image = await faceapi.bufferToImage(this.imageUpload.nativeElement.files[0]);
      container.append(image)
      canvas = faceapi.createCanvasFromMedia(image)
      container.append(canvas)
      const displaySize = { width: image.width, height: image.height }
      faceapi.matchDimensions(canvas, displaySize)
      const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
      results.forEach((result, i) => {
        const box = resizedDetections[i].detection.box
        const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
        if (!canvas) drawBox.draw(canvas)
      })
    }, 100)
  }

  loadLabeledImages() {
    const labels = ['Khanh', 'Khoi']
    return Promise.all(
      labels.map(async label => {
        const descriptions = []
        for (let i = 1; i <= 2; i++) {
          const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/Necrophos/Angular-Face-Detection/master/src/assets/labeled_images/${label}/${i}.jpg`)
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
          descriptions.push(detections.descriptor)
        }

        return new faceapi.LabeledFaceDescriptors(label, descriptions)
      })
    )
  }
}
