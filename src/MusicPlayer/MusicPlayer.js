document.addEventListener('DOMContentLoaded', () => {
    const playPauseButton = document.querySelector('.play-pause-button');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    const trackTitle = document.querySelector('.track-title');
    const trackArtist = document.querySelector('.track-artist');

    let isPlaying = false;
    let currentTrackIndex = 0;

    const tracks = [
        {
            title: 'Track 1',
            artist: 'Artist 1',
            url: '/assets/music/StandingBy.mp3'
        },
        {
            title: 'Track 2',
            artist: 'Artist 2',
            url: '/assets/music/SentientHeat.mp3'
        }
        // Add more tracks as needed
    ];

    const audio = new Audio(tracks[currentTrackIndex].url);

    const updateTrackInfo = () => {
        trackTitle.textContent = tracks[currentTrackIndex].title;
        trackArtist.textContent = tracks[currentTrackIndex].artist;
    };

    const playPauseTrack = () => {
        if (isPlaying) {
            audio.pause();
            playPauseButton.textContent = 'Play';
        } else {
            audio.play();
            playPauseButton.textContent = 'Pause';
        }
        isPlaying = !isPlaying;
    };

    const prevTrack = () => {
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        audio.src = tracks[currentTrackIndex].url;
        updateTrackInfo();
        if (isPlaying) {
            audio.play();
        }
    };

    const nextTrack = () => {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        audio.src = tracks[currentTrackIndex].url;
        updateTrackInfo();
        if (isPlaying) {
            audio.play();
        }
    };

    playPauseButton.addEventListener('click', playPauseTrack);
    prevButton.addEventListener('click', prevTrack);
    nextButton.addEventListener('click', nextTrack);

    updateTrackInfo();
});