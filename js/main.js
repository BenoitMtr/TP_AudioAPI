window.onload=init;
let video= document.querySelector("#videoTP");
let buttons=document.querySelector("#buttonSet");
let source=document.querySelector("#source");

function init()
{
  // function called when the page is loaded
  buttons.width=video.width;
}

function playVideo()
{
  video.play();
}

function pauseVideo()
{
  video.pause();
}

function changeVideo()
{
  source.src="videos/FUCKBOYZ.mp4";
  video.load();
}

function rewindVideo()
{
  video.currentTime=0;
  video.pause();
}

function ahead(nbSec)
{
  video.currentTime+=nbSec;
}

function backwards(nbSec)
{
  video.currentTime-=nbSec;
}

function loop()
{
  video.loop=!video.loop;
}
