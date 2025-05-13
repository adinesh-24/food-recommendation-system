import { useState, useEffect } from 'react';
import { searchFoodImages, getRandomFoodImage } from '@/services/unsplashService';
import { UnsplashImage } from '@/types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface FoodImageGalleryProps {
  query?: string;
  cuisine?: 'north-indian' | 'south-indian';
  onImageSelect?: (image: UnsplashImage) => void;
}

export function FoodImageGallery({ query, cuisine, onImageSelect }: FoodImageGalleryProps) {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImages() {
      try {
        setLoading(true);
        setError(null);
        
        let searchQuery = query;
        if (cuisine) {
          searchQuery = `${cuisine === 'north-indian' ? 'North Indian' : 'South Indian'} food ${query || ''}`;
        }
        
        const fetchedImages = searchQuery
          ? await searchFoodImages(searchQuery)
          : [await getRandomFoodImage()];
        setImages(fetchedImages);
      } catch (err) {
        setError("Failed to load images. Please try again later.");
        console.error("Error fetching images:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, [query, cuisine]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-red-500 p-4 rounded-lg bg-red-50"
      >
        {error}
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => onImageSelect?.(image)}
            >
              <div className="relative group">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-600">
                  Photo by{" "}
                  <a
                    href={image.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-nutrition-green hover:underline"
                  >
                    {image.photographer}
                  </a>
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 