import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firestore';

export interface FoodRecommendation {
  id?: string;
  name: string;
  ingredients: string[];
  timestamp: Date;
  userId?: string;
  rating?: number;
  category?: string;
  cuisine?: string;
  preparationTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export const addRecommendation = async (recommendation: Omit<FoodRecommendation, 'id' | 'timestamp'>) => {
  try {
    const docRef = await addDoc(collection(db, 'recommendations'), {
      ...recommendation,
      timestamp: serverTimestamp(),
    });
    console.log("Recommendation added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding recommendation: ", error);
    throw error;
  }
};

export const getRecentRecommendations = async (limitCount: number = 10) => {
  try {
    const q = query(
      collection(db, 'recommendations'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const recommendations: FoodRecommendation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      recommendations.push({
        id: doc.id,
        name: data.name,
        ingredients: data.ingredients,
        timestamp: data.timestamp?.toDate() || new Date(),
        userId: data.userId,
        rating: data.rating,
        category: data.category,
        cuisine: data.cuisine,
        preparationTime: data.preparationTime,
        difficulty: data.difficulty,
        nutritionalInfo: data.nutritionalInfo,
      });
    });
    
    return recommendations;
  } catch (error) {
    console.error("Error getting recommendations: ", error);
    throw error;
  }
};

export const getUserRecommendations = async (userId: string, limitCount: number = 10) => {
  try {
    const q = query(
      collection(db, 'recommendations'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const recommendations: FoodRecommendation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === userId) {
        recommendations.push({
          id: doc.id,
          name: data.name,
          ingredients: data.ingredients,
          timestamp: data.timestamp?.toDate() || new Date(),
          userId: data.userId,
          rating: data.rating,
          category: data.category,
          cuisine: data.cuisine,
          preparationTime: data.preparationTime,
          difficulty: data.difficulty,
          nutritionalInfo: data.nutritionalInfo,
        });
      }
    });
    
    return recommendations;
  } catch (error) {
    console.error("Error getting user recommendations: ", error);
    throw error;
  }
}; 