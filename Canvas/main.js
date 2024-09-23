const video = document.getElementById('video');
const audio = document.getElementById('audio');

video.addEventListener('play', () => {
    console.log('Video is playing');
});

audio.addEventListener('volumechange', () => {
    console.log('Audio volume changed');
});
