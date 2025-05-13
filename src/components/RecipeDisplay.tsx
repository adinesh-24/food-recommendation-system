import { useState } from 'react';
import { getRecipe } from '@/services/geminiService';
import { LoadingSpinner } from './ui/loading-spinner';
import { Clock, ChefHat, Scale, Info, Timer, AlertCircle } from 'lucide-react';

interface RecipeDisplayProps {
  mealName: string;
  cuisine?: 'north-indian' | 'south-indian';
}

export function RecipeDisplay({ mealName, cuisine }: RecipeDisplayProps) {
  const [recipe, setRecipe] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);
      const recipeText = await getRecipe(mealName, cuisine);
      setRecipe(recipeText);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setError('Failed to load recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseRecipe = (text: string) => {
    const sections = {
      ingredients: '',
      instructions: '',
      time: '',
      tips: '',
      nutrition: ''
    };

    const lines = text.split('\n');
    let currentSection = '';

    lines.forEach(line => {
      if (line.toLowerCase().includes('ingredients')) {
        currentSection = 'ingredients';
      } else if (line.toLowerCase().includes('instructions') || line.toLowerCase().includes('steps')) {
        currentSection = 'instructions';
      } else if (line.toLowerCase().includes('time') || line.toLowerCase().includes('duration')) {
        currentSection = 'time';
      } else if (line.toLowerCase().includes('tips') || line.toLowerCase().includes('notes')) {
        currentSection = 'tips';
      } else if (line.toLowerCase().includes('nutrition') || line.toLowerCase().includes('calories')) {
        currentSection = 'nutrition';
      }

      if (currentSection && line.trim()) {
        sections[currentSection as keyof typeof sections] += line + '\n';
      }
    });

    return sections;
  };

  const renderSection = (title: string, content: string, icon: React.ReactNode) => {
    if (!content) return null;
    
    const isExpanded = expandedSection === title;
    
    return (
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : title)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {isExpanded && (
          <div className="px-6 pb-4">
            <div className="prose max-w-none">
              {content.split('\n').map((line, index) => (
                <p key={index} className="mb-2 text-gray-700">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Recipe for {mealName}
            {cuisine && <span className="text-gray-600"> ({cuisine})</span>}
          </h2>
          <p className="text-gray-500 mt-1">Get detailed instructions and ingredients</p>
        </div>
        <button
          onClick={fetchRecipe}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Generating Recipe...</span>
            </>
          ) : (
            <>
              <ChefHat size={20} />
              <span>Get Recipe</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-1 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {recipe && (
        <div className="space-y-4">
          {renderSection('Ingredients', parseRecipe(recipe).ingredients, <Scale size={20} className="text-blue-600" />)}
          {renderSection('Instructions', parseRecipe(recipe).instructions, <ChefHat size={20} className="text-green-600" />)}
          {renderSection('Time & Difficulty', parseRecipe(recipe).time, <Timer size={20} className="text-amber-600" />)}
          {renderSection('Tips & Notes', parseRecipe(recipe).tips, <Info size={20} className="text-purple-600" />)}
          {renderSection('Nutrition Info', parseRecipe(recipe).nutrition, <Clock size={20} className="text-red-600" />)}
        </div>
      )}

      {!recipe && !loading && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
          <ChefHat size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Cook?</h3>
          <p className="text-gray-500">
            Click "Get Recipe" to see the detailed recipe for {mealName}
          </p>
        </div>
      )}
    </div>
  );
} 