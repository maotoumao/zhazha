import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AudioHandler from './views/audioHandler';
import Keyboard from './views/keyboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Keyboard />} />
        <Route path="/audio-handler" element={<AudioHandler />} />
      </Routes>
    </Router>
  );
}
