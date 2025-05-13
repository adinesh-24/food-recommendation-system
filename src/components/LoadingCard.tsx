import { Card } from "@/components/ui/card";

const LoadingCard = () => {
  return (
    <Card className="w-full max-w-3xl mx-auto p-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="rounded-full bg-nutrition-green/10 p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nutrition-green"></div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-800">Generating Your Diet Plan</h3>
          <p className="text-gray-600">We're creating a personalized diet plan based on your preferences...</p>
        </div>
        
        <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
          <div className="bg-nutrition-green h-2.5 rounded-full animate-pulse w-full"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col space-y-2">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
        
        <div className="animate-pulse space-y-3 w-full max-w-2xl">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </Card>
  );
};

export default LoadingCard; 