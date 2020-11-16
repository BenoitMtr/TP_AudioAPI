
import './lib/webaudio-controls.js';


// create the equalizer. It's a set of biquad Filters

let filters = [];
let ctx = window.AudioContext || window.webkitAudioContext;
let context = new ctx();
let canvas, canvasContext, analyser, bufferLength, dataArray, gradient;

const getBaseURL = () => {
  const base = new URL('.', import.meta.url);
  console.log("Base = " + base);
	return `${base}`;
};

// default pan set to 0 - center
const stereoNode = new StereoPannerNode(context, { pan: 0 });

const template = document.createElement("template");
template.innerHTML = `
  <style>
    H1 {
          color:red;
    }

    #volumeDep
    {
        visibility: hidden;
    }

    #myPlayer
    {
        margin: 0 auto;
        width: 500px;
        display: block;
    }

    #buttonSet, .controls
    {
      margin: 0 auto;
      width: 400px;
    }

    #volume
    {
      margin: auto;
    }

    #balance
    {
      margin: auto;
    }

     #canvasVisualization
    {
    padding-left: 0;
    padding-right: 0;
    margin-left: auto;
    margin-right: auto;
    display: block;
    }

  </style>

  <video id="myPlayer">
    <source id="source" type="video/mp4" />
  </video>

  <div id="buttonSet">
    <button id="playButton"> Jouer la vidéo </button>
    <button id="pauseButton"> Pause </button>
    <button id="rewindButton"> Remettre la vidéo à 0 </button>
    <button id="aheadButton"> +10 secondes </button>
    <button id="backwardsButton"> -10 secondes </button>
    <button id="loopButton"> En boucle </button>
  </div>

  <br>
  <canvas id="canvasVisualization" width=300 height=100></canvas>
  <br><br>

   <div class="controls">
    <label>60Hz</label>
  <webaudio-slider id="range0" direction="horz"
    src="assets/imgs/hsliderbody.png"
    knobsrc="myComponents/assets/imgs/hsliderknob.png"
    min="-30" max="30" step="1"
    width="100" height="20"
    tooltip="Equalizer 60 Hz">
  </webaudio-slider>
  <output id="gain0">0 dB</output>
  </div>

  <div class="controls">
    <label>170Hz</label>
    <webaudio-slider id="range1" direction="horz"
    src="assets/imgs/hsliderbody.png"
    knobsrc="myComponents/assets/imgs/hsliderknob.png"
    min="-30" max="30" step="1"
    width="100" height="20"
    tooltip="Equalizer 170 Hz">
  </webaudio-slider>
  <output id="gain1">0 dB</output>
  </div>

  <div class="controls">
    <label>350Hz</label>
    <webaudio-slider id="range2" direction="horz"
    src="assets/imgs/hsliderbody.png"
    knobsrc="myComponents/assets/imgs/hsliderknob.png"
    min="-30" max="30" step="1"
    width="100" height="20"
    tooltip="Equalizer 350 Hz">
  </webaudio-slider>
  <output id="gain2">0 dB</output>
  </div>

  <div class="controls">
    <label>1000Hz</label>
    <webaudio-slider id="range3" direction="horz"
    src="assets/imgs/hsliderbody.png"
    knobsrc="myComponents/assets/imgs/hsliderknob.png"
    min="-30" max="30" step="1"
    width="100" height="20"
    tooltip="Equalizer 1000 Hz">
  </webaudio-slider>
  <output id="gain3">0 dB</output>
  </div>

  <div class="controls">
    <label>3500Hz</label>
    <webaudio-slider id="range4" direction="horz"
    src="assets/imgs/hsliderbody.png"
    knobsrc="myComponents/assets/imgs/hsliderknob.png"
    min="-30" max="30" step="1"
    width="100" height="20"
    tooltip="Equalizer 3000 Hz">
  </webaudio-slider>
  <output id="gain4">0 dB</output>
  </div>

  <div class="controls">
    <label>10000Hz</label>
    <webaudio-slider id="range5" direction="horz"
    src="assets/imgs/hsliderbody.png"
    knobsrc="myComponents/assets/imgs/hsliderknob.png"
    min="-30" max="30" step="1"
    width="100" height="20"
    tooltip="Equalizer 10000 Hz">
  </webaudio-slider>
  <output id="gain5">0 dB</output>
  </div>
</div>

<input type="range" id="volumeDep" min=0 max=1 step=0.1>

    <label for="volume"> Régler le volume</label>
    <webaudio-knob id="volume"
    src="assets/imgs/LittlePhatty.png" diameter="64"
    sprites="100" value="1"
    min="0" max="1" step="0.01">
  </webaudio-knob>

  <webaudio-knob id="volumeVisualization"
    src="assets/imgs/Vintage_VUMeter_2.png" diameter="64"
    sprites="50" value="1"
    min="0" max="1" step="0.02">
  </webaudio-knob>

<label for="balance">Balance gauche-droite</label>
<webaudio-knob id="balance"
    src="assets/imgs/hsw5.png" sprites="4"
    width="128" height="32"
    value="0" min="-1" max="1">
  </webaudio-knob>
        `;

/**
 * retourne le volume moyen
 * @param array
 * @returns {number}
 */
function getAverageVolume(array) {
  var values = 0;
  var average;

  var length = array.length;

  // get all the frequency amplitudes
  for (var i = 0; i < length; i++) {
    values += array[i];
  }

  average = values / length;
  return average;
}

/**
 * visualisation des fréquences et des volumes
 */
function visualize() {
  // clear the canvas
 // canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  /* graphique des volumes */
  canvasContext.save();

  analyser.getByteFrequencyData(dataArray);
  var average = getAverageVolume(dataArray);

  // set the fill style to a nice gradient
  canvasContext.fillStyle=gradient;

  // draw the vertical meter
  canvasContext.fillRect(0,canvas.height-average,25,canvas.height);

  canvasContext.restore();

  // Or use rgba fill to give a slight blur effect
  canvasContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);

  // Get the analyser data
  analyser.getByteTimeDomainData(dataArray);

  canvasContext.lineWidth = 2;
  canvasContext.strokeStyle = 'lightBlue';

  // all the waveform is in one single path, first let's
  // clear any previous path that could be in the buffer
  canvasContext.beginPath();

  var sliceWidth = canvas.width / bufferLength;
  var x = 0;

  for(var i = 0; i < bufferLength; i++) {
    var v = dataArray[i] / 255;
    var y = v * canvas.height;

    if(i === 0) {
      canvasContext.moveTo(x, y);
    } else {
      canvasContext.lineTo(x, y);
    }

    x += sliceWidth;
  }

  canvasContext.lineTo(canvas.width, canvas.height/2);

  // draw the path at once
  canvasContext.stroke();

  // call again the visualize function at 60 frames/s
  requestAnimationFrame(visualize);
}

/**
 * MyVideoPlayer: composant vidéo custom
 */
class MyVideoPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.appendChild(template.content.cloneNode(true));

    canvas=this.shadowRoot.querySelector("#canvasVisualization");
    canvasContext=canvas.getContext('2d');

    // bouton "en boucle" qu'on met en rouge, car le loop n'est pas activé au chargement
    this.shadowRoot.querySelector("#loopButton").style.color='red';

  // gradient pour le volume
    gradient = canvasContext.createLinearGradient(0,0,0, canvas.height);
    gradient.addColorStop(1,'#000000');
    gradient.addColorStop(0.75,'#ff0000');
    gradient.addColorStop(0.25,'#ffff00');
    gradient.addColorStop(0,'#ffffff');

    this.basePath = getBaseURL(); // url absolu du composant
    // Fix relative path in WebAudio Controls elements
		this.fixRelativeImagePaths();

    this.shadowRoot.querySelector("#source").src=this.getAttribute("src");

    //If src is not found
    /*if(this.shadowRoot.querySelector("#myPlayer").networkState===3)
    {
      console.log("NOT FOUND");
      this.shadowRoot.querySelector("#source").src="videos/FUCKBOYZ.mp4";
    }*/

    let mediaElement = this.shadowRoot.querySelector("#myPlayer");

    let sourceNode = context.createMediaElementSource(mediaElement);

    analyser = context.createAnalyser();
    dataArray = new Uint8Array(bufferLength);

    /* graphique des volumes */
    canvasContext.save();

    analyser.getByteFrequencyData(dataArray);
    var average = getAverageVolume(dataArray);

    // set the fill style to a nice gradient
    canvasContext.fillStyle=gradient;

    // draw the vertical meter
    canvasContext.fillRect(0,canvas.height-average,25,canvas.height);

    canvasContext.restore();

    /* visualisation des fréquences */
    // Create an analyser node
    analyser = context.createAnalyser();

    analyser.fftSize = 1024;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    sourceNode.connect(analyser);
    analyser.connect(context.destination);

    requestAnimationFrame(visualize);

    mediaElement.addEventListener('play',() => context.resume());

    //listener pour la balance gauche-droite
    this.shadowRoot.querySelector("#balance").addEventListener("input", (event) => {
      //balance gauche-droite
      stereoNode.pan.value = event.target.value;
      sourceNode.connect(stereoNode).connect(context.destination);
    });

    // Set filters
    [60, 170, 350, 1000, 3500, 10000].forEach(function(freq, i) {
      var eq = context.createBiquadFilter();
      eq.frequency.value = freq;
      eq.type = "peaking";
      eq.gain.value = 0;
      filters.push(eq);
    });

    // Connect filters in serie
    sourceNode.connect(filters[0]);
    for(var i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i+1]);
    }

    // connect the last filter to the speakers
    filters[filters.length - 1].connect(context.destination);

  }

  connectedCallback() {
    this.player = this.shadowRoot.querySelector("#myPlayer");

    this.declareListeners();
  }

  fixRelativeImagePaths() {
		// change webaudiocontrols relative paths for spritesheets to absolute
		let webaudioControls = this.shadowRoot.querySelectorAll(
			'webaudio-knob, webaudio-slider, webaudio-switch, img'
		);
		webaudioControls.forEach((e) => {
			let currentImagePath = e.getAttribute('src');
			if (currentImagePath !== undefined) {
				//console.log("Got wc src as " + e.getAttribute("src"));
				let imagePath = e.getAttribute('src');
        //e.setAttribute('src', this.basePath  + "/" + imagePath);
        e.src = this.basePath  + "/" + imagePath;
        //console.log("After fix : wc src as " + e.getAttribute("src"));
			}
		});
  }

  declareListeners() {
    this.shadowRoot.querySelector("#playButton").addEventListener("click", (event) => {
      this.play();
    });
    this.shadowRoot.querySelector("#pauseButton").addEventListener("click", (event) => {
      this.player.pause();
    });
    this.shadowRoot.querySelector("#rewindButton").addEventListener("click", (event) => {
      this.player.currentTime=0;
    });
    this.shadowRoot.querySelector("#aheadButton").addEventListener("click", (event) => {
      this.player.currentTime+=10;
    });
    this.shadowRoot.querySelector("#backwardsButton").addEventListener("click", (event) => {
      this.player.currentTime-=10;
    });
    this.shadowRoot.querySelector("#loopButton").addEventListener("click", (event) => {
      this.player.loop=!this.player.loop;
      if(this.player.loop) this.shadowRoot.querySelector("#loopButton").style.color='blue';
      else this.shadowRoot.querySelector("#loopButton").style.color='red';
    });

    this.shadowRoot.querySelector("#range0").addEventListener("input", (event) => {
      this.changeGain(this.shadowRoot.querySelector("#range0").value, 0);
    });

    this.shadowRoot.querySelector("#range1").addEventListener("input", (event) => {
      this.changeGain(this.shadowRoot.querySelector("#range1").value, 1);
    });

    this.shadowRoot.querySelector("#range2").addEventListener("input", (event) => {
      this.changeGain(this.shadowRoot.querySelector("#range2").value, 2);
    });

    this.shadowRoot.querySelector("#range3").addEventListener("input", (event) => {
      this.changeGain(this.shadowRoot.querySelector("#range3").value, 3);
    });

    this.shadowRoot.querySelector("#range4").addEventListener("input", (event) => {
      this.changeGain(this.shadowRoot.querySelector("#range4").value, 4);
    });

    this.shadowRoot.querySelector("#range5").addEventListener("input", (event) => {
      this.changeGain(this.shadowRoot.querySelector("#range5").value, 5);
    });


    this.shadowRoot
      .querySelector("#volume")
      .addEventListener("input", (event) => {
        this.setVolume(event.target.value);
        this.shadowRoot.querySelector("#volumeVisualization").value=event.target.value;
      });
  }

  // API
  setVolume(val) {
    this.player.volume = val;
  }

  play() {
    this.player.play();
  }

  changeGain(sliderVal,nbFilter) {
    let value = parseFloat(sliderVal);
    filters[nbFilter].gain.value = value;

    // update output labels
    let output = this.shadowRoot.querySelector("#gain" + nbFilter);
    output.value = value + " dB";
  }
}


customElements.define("my-videoplayer", MyVideoPlayer);
