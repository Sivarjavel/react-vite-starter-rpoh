import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
    // State to manage the transcription log
    const [finalTranscript, setFinalTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    
    // State to manage the UI and the listening status
    const [isListening, setIsListening] = useState(false);
    
    // Ref for the recognition object so it persists across renders
    const recognitionRef = useRef(null);
    
    // Ref for the text log element to enable auto-scrolling
    const transcribedTextRef = useRef(null);

    // Effect to handle auto-scrolling when content updates
    useEffect(() => {
        if (transcribedTextRef.current) {
            transcribedTextRef.current.scrollTop = transcribedTextRef.current.scrollHeight;
        }
    }, [finalTranscript, interimTranscript]);
    
    // Effect to initialize the Speech Recognition API
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        const SpeechRecognition = window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Configuration
        recognition.continuous = true; 
        recognition.interimResults = true;
        recognition.lang = 'en-US'; 
        
        recognitionRef.current = recognition;

        // --- Event Handlers ---

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            alert(`Speech Recognition Error: ${event.error}`);
        };

        recognition.onresult = (event) => {
            let newFinal = finalTranscript;
            let newInterim = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    newFinal += transcript + '. ';
                } else {
                    newInterim += transcript;
                }
            }
            
            setFinalTranscript(newFinal);
            setInterimTranscript(newInterim);
        };
        
        // Clean up the recognition object when the component unmounts
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []); // Run only on initial mount
    
    // --- UI/Logic Handlers ---
    
    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            // Reset transcripts before starting a new session
            setFinalTranscript('');
            setInterimTranscript('');
            try {
                recognitionRef.current.start();
            } catch (error) {
                // Catch error if start is called while recognition is already active
                if (error.name !== 'InvalidStateError') {
                    console.error("Error starting recognition:", error);
                }
            }
        }
    };

    return (
        <div className="container">
            {/* The Miss Minutes AI Character Area (Left Side) */}
            <div className="character-box">
                <div id="miss-minutes-ai" className={`miss-minutes-ai ${isListening ? 'listening' : ''}`}>
                    <div className="clock-face">
                        <span id="listening-indicator" className="indicator"></span>
                        <p className="text-label">Ms. M</p>
                    </div>
                    <div className="caption">
                        {isListening ? 'Listening... Speak Now!' : 'Click to Start Listening!'}
                    </div>
                </div>
                <button id="start-stop-btn" onClick={toggleListening}>
                    {isListening ? 'Stop Listening' : 'Start Listening'}
                </button>
            </div>

            {/* The Right-Side Transcription Area */}
            <div className="transcription-output">
                <h2>Transcription Log</h2>
                <div id="transcribed-text" className="text-log" ref={transcribedTextRef}>
                    {finalTranscript ? (
                        <p><strong>Final:</strong> {finalTranscript}</p>
                    ) : (
                        <p className="initial-message">
                            Your spoken words will appear here in real-time.
                        </p>
                    )}
                    {interimTranscript && (
                        <p style={{ color: '#777' }}>Live: {interimTranscript}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
