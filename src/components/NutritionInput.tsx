import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { UserData } from "@/types";

interface NutritionInputProps {
  data: UserData;
  onChange: (name: string, value: number | undefined) => void;
}

const NutritionInput: React.FC<NutritionInputProps> = ({ data, onChange }) => {
  const handleChange = (name: string, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    
    if (value === "" || (!isNaN(numValue!) && numValue! >= 0)) {
      onChange(name, numValue);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
      >
        <h3 className="text-lg font-medium mb-4">Nutrition Information</h3>
        <p className="text-sm text-gray-500 mb-6">
          Enter your target nutrition values to get a more personalized diet plan.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calories */}
          <div>
            <Label htmlFor="calories">Total Calories</Label>
            <div className="relative mt-2">
              <Input
                id="calories"
                type="number"
                min={0}
                value={data.calories !== undefined ? data.calories : ""}
                onChange={(e) => handleChange("calories", e.target.value)}
                className="pr-16"
                placeholder="e.g. 2000"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-gray-500">
                kcal/day
              </div>
            </div>
          </div>

          {/* Protein */}
          <div>
            <Label htmlFor="protein">Protein</Label>
            <div className="relative mt-2">
              <Input
                id="protein"
                type="number"
                min={0}
                value={data.protein !== undefined ? data.protein : ""}
                onChange={(e) => handleChange("protein", e.target.value)}
                className="pr-16"
                placeholder="e.g. 120"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-gray-500">
                grams/day
              </div>
            </div>
          </div>

          {/* Carbs */}
          <div>
            <Label htmlFor="carbs">Carbohydrates</Label>
            <div className="relative mt-2">
              <Input
                id="carbs"
                type="number"
                min={0}
                value={data.carbs !== undefined ? data.carbs : ""}
                onChange={(e) => handleChange("carbs", e.target.value)}
                className="pr-16"
                placeholder="e.g. 250"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-gray-500">
                grams/day
              </div>
            </div>
          </div>

          {/* Fat */}
          <div>
            <Label htmlFor="fat">Fat</Label>
            <div className="relative mt-2">
              <Input
                id="fat"
                type="number"
                min={0}
                value={data.fat !== undefined ? data.fat : ""}
                onChange={(e) => handleChange("fat", e.target.value)}
                className="pr-16"
                placeholder="e.g. 65"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-gray-500">
                grams/day
              </div>
            </div>
          </div>

          {/* Fiber */}
          <div className="md:col-span-2">
            <Label htmlFor="fiber">Fiber</Label>
            <div className="relative mt-2">
              <Input
                id="fiber"
                type="number"
                min={0}
                value={data.fiber !== undefined ? data.fiber : ""}
                onChange={(e) => handleChange("fiber", e.target.value)}
                className="pr-16"
                placeholder="e.g. 30"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-gray-500">
                grams/day
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> If you don't know your exact requirements, you can leave these fields 
            empty and our system will calculate appropriate values based on your age, height, 
            weight and activity level.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default NutritionInput; 