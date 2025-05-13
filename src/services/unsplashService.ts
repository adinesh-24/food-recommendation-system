import { UnsplashImage } from "@/types";

// Using Unsplash's demo access key for development
const UNSPLASH_ACCESS_KEY = '896d4f52c589547b2134bd75ed48742db637fa51810b49b607e37e46ab2c0043';

const FALLBACK_IMAGES = {
  'north-indian': {
    breakfast: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    lunch: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    dinner: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    snacks: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80'
  },
  'south-indian': {
    breakfast: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    lunch: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    dinner: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    snacks: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80'
  }
};

export async function searchFoodImages(query: string, cuisine?: 'north-indian' | 'south-indian'): Promise<UnsplashImage[]> {
  try {
    // Enhance the search query with more specific terms
    const cuisinePrefix = cuisine === 'north-indian' ? 'North Indian' : 
                         cuisine === 'south-indian' ? 'South Indian' : '';
    
    const searchQuery = `${cuisinePrefix} ${query} food dish meal cuisine`;
    console.log("Searching Unsplash with query:", searchQuery);

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=3&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.warn(`Unsplash API error: ${response.status} - ${response.statusText}`);
      return getFallbackImage(query, cuisine);
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      console.warn("No images found for query:", searchQuery);
      return getFallbackImage(query, cuisine);
    }

    // Filter results to ensure they are food-related
    const foodImages = data.results.filter((photo: any) => {
      const tags = photo.tags?.map((tag: any) => tag.title.toLowerCase()) || [];
      const description = (photo.description || photo.alt_description || '').toLowerCase();
      return tags.some((tag: string) => 
        tag.includes('food') || 
        tag.includes('dish') || 
        tag.includes('meal') ||
        tag.includes('cuisine') ||
        tag.includes('cooking') ||
        tag.includes('restaurant')
      ) || description.includes('food') || description.includes('dish');
    });

    if (foodImages.length === 0) {
      console.warn("No food-related images found for query:", searchQuery);
      return getFallbackImage(query, cuisine);
    }

    return foodImages.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular,
      alt: photo.alt_description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
    }));
  } catch (error) {
    console.error('Error searching food images:', error);
    return getFallbackImage(query, cuisine);
  }
}

// Helper function to get fallback image
function getFallbackImage(query: string, cuisine?: 'north-indian' | 'south-indian'): UnsplashImage[] {
  const mealType = query.toLowerCase().includes('breakfast') ? 'breakfast' :
                  query.toLowerCase().includes('lunch') ? 'lunch' :
                  query.toLowerCase().includes('dinner') ? 'dinner' : 'snacks';
  
  return [{
    id: 'fallback',
    url: cuisine ? FALLBACK_IMAGES[cuisine][mealType] : FALLBACK_IMAGES['north-indian'][mealType],
    alt: query,
    photographer: 'Unsplash',
    photographerUrl: 'https://unsplash.com'
  }];
}

export async function getRandomFoodImage(): Promise<UnsplashImage> {
  try {
    const response = await fetch(
      'https://api.unsplash.com/photos/random?query=food fruit cuisine&orientation=landscape&content_filter=high',
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.warn(`Unsplash API error: ${response.status} - ${response.statusText}`);
      return {
        id: 'fallback',
        url: FALLBACK_IMAGES['north-indian'].lunch,
        alt: 'Food image',
        photographer: 'Unsplash',
        photographerUrl: 'https://unsplash.com'
      };
    }

    const photo = await response.json();
    return {
      id: photo.id,
      url: photo.urls.regular,
      alt: photo.alt_description || 'Food image',
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
    };
  } catch (error) {
    console.error('Error fetching random food image:', error);
    return {
      id: 'fallback',
      url: FALLBACK_IMAGES['north-indian'].lunch,
      alt: 'Food image',
      photographer: 'Unsplash',
      photographerUrl: 'https://unsplash.com'
    };
  }
} 