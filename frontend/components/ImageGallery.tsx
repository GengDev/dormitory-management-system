/**
 * Image Gallery Component
 * 
 * แสดงผลรูปภาพแบบ Gallery พร้อม Lightbox สุดพรีเมียม
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface ImageGalleryProps {
    images: string[];
    aspectRatio?: 'square' | 'video' | 'auto';
}

export default function ImageGallery({ images, aspectRatio = 'video' }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIndex === null) return;
        setSelectedIndex((selectedIndex + 1) % images.length);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIndex === null) return;
        setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    };

    const ratioClass = {
        square: 'aspect-square',
        video: 'aspect-video',
        auto: 'aspect-auto'
    }[aspectRatio];

    if (!images || images.length === 0) {
        return (
            <div className={`w-full ${ratioClass} bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 font-bold border-2 border-dashed border-gray-200`}>
                ไม่มีรูปภาพ
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                    <motion.div
                        key={index}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedIndex(index)}
                        className={`relative group cursor-pointer overflow-hidden rounded-2xl shadow-sm border border-black/5 ${ratioClass}`}
                    >
                        <img
                            src={image}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Maximize2 className="text-white w-8 h-8" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selectedIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setSelectedIndex(null)}
                    >
                        <button
                            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                            onClick={() => setSelectedIndex(null)}
                        >
                            <X size={32} />
                        </button>

                        {images.length > 1 && (
                            <>
                                <button
                                    className="absolute left-8 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                    onClick={handlePrev}
                                >
                                    <ChevronLeft size={48} />
                                </button>
                                <button
                                    className="absolute right-8 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                    onClick={handleNext}
                                >
                                    <ChevronRight size={48} />
                                </button>
                            </>
                        )}

                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="max-w-5xl w-full max-h-[80vh] flex items-center justify-center"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <img
                                src={images[selectedIndex]}
                                alt="Selected gallery image"
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                            />
                        </motion.div>

                        <div className="absolute bottom-8 left-0 right-0 text-center">
                            <p className="text-white/70 font-bold tracking-widest uppercase text-xs">
                                {selectedIndex + 1} / {images.length}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
