import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  UtensilsCrossed, 
  Sparkles, 
  Calendar, 
  History, 
  ChevronRight, 
  Star, 
  Clock, 
  CloudLightning,
  Leaf
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
    <div className="w-12 h-12 bg-nutrition-green bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
      <Icon className="h-6 w-6 text-nutrition-green" />
    </div>
    <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-nutrition-green bg-opacity-5 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Your <span className="text-nutrition-green">Personalized</span> Diet Journey
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Get AI-powered diet plans tailored to your preferences, health goals, and favorite cuisines. TasteFlow makes healthy eating delicious and simple.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="bg-nutrition-green hover:bg-nutrition-green/90">
                    <Link to="/generate">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Meal Plan
                    </Link>
                  </Button>
                  {!user && (
                    <Button asChild variant="outline" size="lg">
                      <Link to="/login">
                        Sign In
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <img
                    className="w-full"
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1160&auto=format&fit=crop"
                    alt="Healthy meal with vegetables and grains"
                  />
                  <div className="absolute inset-0 bg-nutrition-green bg-opacity-30 flex items-center justify-center">
                    <Button asChild size="lg" className="bg-white text-nutrition-green hover:bg-white/90">
                      <Link to="/generate">
                        Start Your Journey
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Features that make healthy eating easier</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform helps you create personalized diet plans that fit your lifestyle
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Sparkles}
              title="AI-Generated Meal Plans"
              description="Get custom meal plans based on your dietary preferences, health goals, and favorite cuisines."
            />
            <FeatureCard
              icon={Leaf}
              title="Nutrition Focused"
              description="Every meal plan is carefully balanced for optimal nutrition with detailed macronutrient information."
            />
            <FeatureCard
              icon={Calendar}
              title="Multi-day Planning"
              description="Create plans for a day, a week, or longer with no meal repetition and variety built in."
            />
            <FeatureCard
              icon={CloudLightning}
              title="Fast Generation"
              description="Get your custom diet plan in seconds with our advanced AI technology."
            />
            <FeatureCard
              icon={History}
              title="Save Your Plans"
              description="Store and access your favorite meal plans anytime, even offline."
            />
            <FeatureCard
              icon={Clock}
              title="Quick Recipes"
              description="Access detailed recipes for each meal with preparation times and instructions."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-nutrition-green bg-opacity-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Ready to transform your diet?
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-3xl">
                Create your personalized meal plan today. It's free, fast, and tailored just for you.
              </p>
              <div className="mt-8">
                <Button asChild size="lg" className="bg-nutrition-green hover:bg-nutrition-green/90">
                  <Link to="/generate">
                    <UtensilsCrossed className="mr-2 h-5 w-5" />
                    Generate My Meal Plan
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 flex justify-center">
              <div className="relative inline-block">
                <img
                  className="rounded-lg shadow-lg"
                  src="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1170&auto=format&fit=crop"
                  alt="Healthy food"
                />
                <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="inline-block h-8 w-8 rounded-full bg-nutrition-green text-white flex items-center justify-center text-xs font-medium">
                          <Star size={16} />
                        </div>
                      ))}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Loved by users</p>
                      <p className="text-xs text-gray-500">Create your plan today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 