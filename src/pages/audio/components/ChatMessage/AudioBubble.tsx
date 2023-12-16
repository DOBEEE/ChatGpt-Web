import React, { useState, useRef } from 'react';
import './AudioBubble.css';

const AudioBubble = ({ audioSrc, duration = '' }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handlePlay = () => setPlaying(true);
  const handlePause = () => setPlaying(false);
  const handleEnded = () => setPlaying(false);

  return (
    <div className="audio-bubble" onClick={togglePlay}>
      <audio
        ref={audioRef}
        src={audioSrc}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      />
      <div className={`bubble ${playing ? 'playing' : ''}`}>
        <div className="play-icon">{playing ? '⏸️' : '▶️'}</div>
        <div>{duration}</div>
      </div>
    </div>
  );
};

export default AudioBubble;
