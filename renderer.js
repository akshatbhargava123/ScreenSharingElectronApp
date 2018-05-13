// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const electron = require('electron')
const fs = require('fs');

let recorder, blobs = [];

function startRecording() {
  electron.desktopCapturer.getSources({ types: ['window', 'screen'] }, (error, sources) => {
    if (error) throw error
    for (let i = 0; i < sources.length; ++i) {
      if (sources[i].name.indexOf('Visual Studio Code') > -1) {
        console.log()
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sources[i].id
            }
          }
        })
          .then((stream) => handleStream(stream))
          .catch((e) => handleUserMediaError(e))
        return
      }
    }
  })
}

function handleStream(stream) {
  document.querySelector('video').srcObject = stream;
  recorder = new MediaRecorder(stream);
  blobs = [];
  recorder.ondataavailable = function (event) {
    console.log(event.data)
    blobs.push(event.data);
  };
  recorder.start();
}

function stopRecording() {
  recorder.onstop = (data) => {
    toArrayBuffer(new Blob(blobs, { type: 'video/mp4' }), function (ab) {
      var buffer = toBuffer(ab);
      var file = `/video/example.mp4`;
      fs.writeFile(__dirname + file, buffer, function (err) {
        if (err) {
          console.error('Failed to save video ' + err);
        } else {
          console.log('Saved video: ' + file);
        }
      });
    });
  }
  recorder.stop();
}

function handleUserMediaError(e) {
  console.error('handleUserMediaError', e);
}

function toArrayBuffer(blob, cb) {
  let fileReader = new FileReader();
  fileReader.onload = function () {
    let arrayBuffer = fileReader.result;
    cb(arrayBuffer);
  };
  fileReader.readAsArrayBuffer(blob);
}

function toBuffer(ab) {
  let buffer = new Buffer(ab.byteLength);
  let arr = new Uint8Array(ab);
  for (let i = 0; i < arr.byteLength; i++) {
    buffer[i] = arr[i];
  }
  return buffer;
}

// Record for 7 seconds and save to disk
startRecording();

const toggleButton = document.getElementById('toggleState');
toggleButton.onclick = function() {
  if (toggleButton.innerText == 'Start') {
    startRecording();
  } else {
    stopRecording();
  }
  toggleButton.innerText = toggleButton.innerText == 'Start' ? 'Stop' : 'Start';
}
