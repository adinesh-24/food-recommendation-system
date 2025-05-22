import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UtensilsCrossed, Heart, Leaf, Users, Target, Sparkles, Linkedin, 
  Github, Code2, Brain, Scale, ChefHat, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <div className="p-6">
      <div className="w-12 h-12 bg-nutrition-green/10 rounded-lg flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-nutrition-green" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);

const About = () => {
  const [activeTab, setActiveTab] = useState('vision');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-r from-nutrition-green to-blue-500 py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-6 grid-rows-3 gap-4 h-full">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <UtensilsCrossed className="text-white h-12 w-12" />
              </div>
            ))}
          </div>
        </div>
      
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">About TasteFlow</h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-light">
              Revolutionizing nutrition through the power of AI and personalized meal planning
            </p>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-10 bg-nutrition-green"></div>
                <span className="text-nutrition-green uppercase text-sm font-semibold tracking-wider">Our Story</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Transforming the Way People Approach Nutrition</h2>
              
              <div className="flex border-b border-gray-200">
                <button 
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${activeTab === 'vision' ? 'border-nutrition-green text-nutrition-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('vision')}
                >
                  Vision
                </button>
                <button 
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${activeTab === 'mission' ? 'border-nutrition-green text-nutrition-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('mission')}
                >
                  Mission
                </button>
                <button 
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${activeTab === 'values' ? 'border-nutrition-green text-nutrition-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('values')}
                >
                  Values
                </button>
              </div>
              
              <div className="py-6">
                {activeTab === 'vision' && (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Founded by <span className="font-semibold">Dinesh A</span>, TasteFlow envisions a world where everyone has access to personalized nutrition guidance that fits their unique lifestyle, preferences, and health goals.
                    </p>
                    <p className="text-gray-600">
                      We're building an intelligent platform that combines cutting-edge AI with nutritional science to make healthy eating accessible, enjoyable, and tailored to each individual's needs.
                    </p>
                  </div>
                )}
                
                {activeTab === 'mission' && (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Our mission is to democratize access to personalized nutrition by leveraging Gemini AI to create meal plans that are scientifically sound, delicious, and easy to follow.
                    </p>
                    <p className="text-gray-600">
                      We strive to empower individuals to make better food choices by providing intelligent guidance that adapts to their changing needs and preferences.
                    </p>
                  </div>
                )}
                
                {activeTab === 'values' && (
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Heart className="h-5 w-5 text-nutrition-green mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600"><span className="font-medium text-gray-800">Health-first approach:</span> We prioritize nutritional wellbeing in all our recommendations.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-nutrition-green mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600"><span className="font-medium text-gray-800">Inclusivity:</span> We design for diverse dietary needs, cultural preferences, and health requirements.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Brain className="h-5 w-5 text-nutrition-green mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600"><span className="font-medium text-gray-800">Innovation:</span> We continuously improve our AI systems to provide smarter, more personalized recommendations.</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-nutrition-green/20 to-blue-500/20 rounded-2xl transform rotate-6"></div>
                <img 
                  src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Healthy Food" 
                  className="relative z-10 rounded-2xl shadow-xl w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powered by Advanced Technology</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge technologies to deliver personalized nutrition recommendations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Brain} 
              title="Gemini AI Integration" 
              description="Sophisticated AI models analyze your preferences, dietary needs, and health goals to create truly personalized recommendations."
            />
            <FeatureCard 
              icon={Scale} 
              title="Nutrition Science" 
              description="All meal plans are grounded in scientific research and nutritional expertise, ensuring balanced and healthy recommendations."
            />
            <FeatureCard 
              icon={Code2} 
              title="Modern Tech Stack" 
              description="Built with React, Firebase, and cutting-edge web technologies to provide a seamless and responsive user experience."
            />
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What We Offer</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the key features that make TasteFlow the perfect nutrition companion
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={ChefHat} 
              title="Personalized Meal Plans" 
              description="Custom meal recommendations based on your dietary preferences, health goals, and favorite cuisines."
            />
            <FeatureCard 
              icon={Target} 
              title="Goal-Oriented Planning" 
              description="Whether weight management, muscle gain, or managing health conditions, our plans help you reach your goals."
            />
            <FeatureCard 
              icon={Sparkles} 
              title="Smart Recommendations" 
              description="AI-powered suggestions that adapt to your changing needs, preferences, and feedback."
            />
            <FeatureCard 
              icon={Leaf} 
              title="Dietary Accommodations" 
              description="Support for various dietary patterns including vegan, vegetarian, keto, paleo, and more."
            />
            <FeatureCard 
              icon={Heart} 
              title="Health-Focused" 
              description="Every recommendation is designed to support your overall health and well-being."
            />
            <FeatureCard 
              icon={Users} 
              title="User-Friendly" 
              description="Intuitive interface makes it easy to generate, view, and follow your personalized meal plans."
            />
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-nutrition-green/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-full text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Founder</h2>
              <p className="text-xl text-gray-600 mb-6">
                Dinesh A is passionate about combining AI technology with nutritional science to create solutions that make healthy eating accessible to everyone.
              </p>
              <p className="text-gray-600 mb-8">
                With expertise in machine learning, software development, and a deep interest in nutrition, Dinesh created TasteFlow to help people navigate the complex world of healthy eating with personalized guidance.
              </p>
              <div className="flex gap-4 justify-center md:justify-start">
                <a
                  href="https://linkedin.com/in/dinesh-a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-nutrition-green hover:bg-nutrition-green/90 transition-colors"
                >
                  <Linkedin className="mr-2 h-5 w-5" />
                  Connect on LinkedIn
                </a>
                <a
                  href="https://github.com/dinesh-a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Github className="mr-2 h-5 w-5" />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-nutrition-green to-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Nutrition?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Join TasteFlow today and experience the future of personalized nutrition.
            </p>
            <Button asChild size="lg" className="bg-white text-nutrition-green hover:bg-white/90">
              <Link to="/generate" className="inline-flex items-center">
                Generate Your First Meal Plan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About; 