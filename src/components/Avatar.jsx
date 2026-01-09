import React, { useState } from 'react';
import { getImageUrl } from '../services/api';

const Avatar = ({ src, alt, size = '12', className = '', canEnlarge = true, fallbackText = 'User' }) => {
    const [error, setError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Dynamic sizing if passing a number/string like "12" -> "w-12 h-12"
    // Or allow passing full className overrides
    const sizeClass = size.startsWith('w-') ? size : `w-${size} h-${size}`;

    // Construct Fallback URL (UI Avatars)
    const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackText)}&background=CBD5E0&color=fff&bold=true`;

    const finalSrc = (!src || error) ? fallbackSrc : getImageUrl(src);

    const handleClick = (e) => {
        if (canEnlarge && src && !error) {
            e.stopPropagation(); // Prevent triggering parent clicks
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <img
                src={finalSrc}
                alt={alt || 'Avatar'}
                onError={() => setError(true)}
                onClick={handleClick}
                className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm bg-gray-200 transition-transform hover:scale-105 ${canEnlarge ? 'cursor-zoom-in' : ''} ${className}`}
            />

            {/* Lightbox Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div className="relative max-w-full max-h-full">
                        <img
                            src={getImageUrl(src)}
                            alt={alt}
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain animate-scaleIn"
                        />
                        <button
                            className="absolute -top-10 right-0 text-white text-xl font-bold bg-white/20 hover:bg-white/40 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                            onClick={() => setIsModalOpen(false)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Avatar;
