import { useState, useEffect, useCallback } from 'react';
import { searchFoodImages } from '@/services/unsplashService';
import { UnsplashImage } from '@/types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface MealImagesProps {
  mealName: string;
  cuisine?: 'north-indian' | 'south-indian';
}

const FALLBACK_IMAGE = {
  id: 'fallback',
  url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  alt: 'Healthy food',
  photographer: 'Unsplash',
  photographerUrl: 'https://unsplash.com',
};

export function MealImages({ mealName, cuisine }: MealImagesProps) {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let searchQuery = mealName;
      if (cuisine) {
        searchQuery = `${cuisine === 'north-indian' ? 'North Indian' : 'South Indian'} ${mealName}`;
      }
      
      const fetchedImages = await searchFoodImages(searchQuery);
      setImages(fetchedImages.length > 0 ? fetchedImages : [FALLBACK_IMAGE]);
    } catch (err) {
      console.error("Error fetching images:", err);
      setError("Failed to load images");
      setImages([FALLBACK_IMAGE]);
    } finally {
      setLoading(false);
    }
  }, [mealName, cuisine]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Card className="overflow-hidden">
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Card className="overflow-hidden">
          <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">Failed to load image</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <AnimatePresence mode="wait">
        {images.slice(0, 1).map((image) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden">
              <div className="relative group">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
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