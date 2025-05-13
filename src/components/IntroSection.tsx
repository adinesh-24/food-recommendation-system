
import React from 'react';
import { Utensils, Egg, Heart } from "lucide-react";
import { Card } from '@/components/ui/card';

const IntroSection: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto mb-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-2 bg-nutrition-green-light bg-opacity-20 rounded-full mb-4">
          <Utensils className="h-6 w-6 text-nutrition-green" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
          Your Personalized <span className="text-nutrition-green">AI Nutrition</span> Assistant
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get customized meal plans tailored to your unique body, dietary preferences, and health goals. Powered by Gemini 2.0 Flash AI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Personalized Plans</h3>
            <p className="text-gray-600 text-sm">
              Tailored meal recommendations based on your body metrics and dietary preferences
            </p>
          </div>
        </Card>

        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Egg className="h-5 w-5 text-nutrition-green" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Dietary Restrictions</h3>
            <p className="text-gray-600 text-sm">
              Handles allergies and special diets like vegetarian, vegan, and more
            </p>
          </div>
        </Card>

        <Card className="p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Health-Focused</h3>
            <p className="text-gray-600 text-sm">
              Nutritionally balanced meals to support your overall health and wellness
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IntroSection;
