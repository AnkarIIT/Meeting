import React, { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';

interface EndMeetingProps {
  onHome: () => void;
}

const EndMeeting: React.FC<EndMeetingProps> = ({ onHome }) => {
  const [rating, setRating] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onHome]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-gray-800 relative overflow-hidden">
      
      {/* Background decorations matching the app theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-200/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-200/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/60 text-center max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onHome}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">Meeting Ended</h2>
        <p className="text-gray-600 mb-8">How was the audio and video quality?</p>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 focus:outline-none group"
            >
              <Star 
                size={32} 
                className={`${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 group-hover:text-yellow-200'} transition-colors duration-200`} 
              />
            </button>
          ))}
        </div>

        {/* Countdown Circle */}
        <div className="relative flex items-center justify-center mb-8">
           <svg className="w-24 h-24 transform -rotate-90">
             {/* Track Circle */}
             <circle
               cx="48"
               cy="48"
               r="40"
               stroke="#e5e7eb"
               strokeWidth="6"
               fill="transparent"
             />
             {/* Progress Circle (Parrot Green) */}
             <circle
               cx="48"
               cy="48"
               r="40"
               stroke="currentColor"
               strokeWidth="6"
               fill="transparent"
               strokeDasharray={251.2}
               strokeDashoffset={251.2 - (251.2 * timeLeft) / 5}
               className="text-brand-500 transition-all duration-1000 ease-linear"
               strokeLinecap="round"
             />
           </svg>
           <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-brand-600 font-mono">
             {timeLeft}
           </div>
        </div>
        
        <div className="space-y-3">
             <button 
               onClick={onHome}
               className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/20"
             >
               Submit Feedback
             </button>
             <button 
               onClick={onHome}
               className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium hover:bg-white/50 rounded-xl transition-colors text-sm"
             >
               Cancel
             </button>
        </div>

      </div>
    </div>
  );
};

export default EndMeeting;