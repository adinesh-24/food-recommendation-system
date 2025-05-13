import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { UserData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import NutritionInput from "./NutritionInput";

const DIETARY_PREFERENCES = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "non-vegetarian", label: "Non-Vegetarian" },
  { id: "both", label: "Both" },
];

const CUISINE_PREFERENCES = [
  { id: "north-indian", label: "North Indian" },
  { id: "south-indian", label: "South Indian" },
  { id: "both", label: "Both North & South Indian" },
];

const COMMON_ALLERGIES = [
  { id: "nuts", label: "Nuts" },
  { id: "dairy", label: "Dairy" },
  { id: "eggs", label: "Eggs" },
  { id: "soy", label: "Soy" },
  { id: "wheat", label: "Wheat" },
  { id: "seafood", label: "Seafood" },
];

interface MultiStepFormProps {
  onSubmit: (data: UserData) => Promise<void>;
  isLoading: boolean;
}

const MultiStepForm: React.FC<MultiStepFormProps> = ({ onSubmit, isLoading }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserData>({
    age: 30,
    height: 170,
    weight: 70,
    dietaryPreference: "vegetarian",
    cuisinePreference: "both",
    allergies: [],
    days: 3,
    useNutritionInput: false,
  });

  const validateStep = (stepNumber: number) => {
    if (stepNumber === 1) {
      if (formData.useNutritionInput) {
        // Validate nutrition inputs if they're being used
        if (formData.calories !== undefined && formData.calories < 500) {
          toast({
            title: "Invalid calorie input",
            description: "Please enter a realistic daily calorie target (minimum 500 kcal)",
            variant: "destructive",
          });
          return false;
        }
        return true;
      } else {
        // Validate basic info
        if (!formData.age || !formData.height || !formData.weight) {
          toast({
            title: "Missing information",
            description: "Please fill in all required fields",
            variant: "destructive",
          });
          return false;
        }
        if (formData.age < 18 || formData.age > 100) {
          toast({
            title: "Invalid age",
            description: "Please enter a valid age between 18 and 100",
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const goToStep = (targetStep: number) => {
    if (targetStep < step || validateStep(targetStep - 1)) {
      setStep(targetStep);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "days" ? parseInt(value) : value }));
  };

  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    }
  };

  const handleNutritionChange = (name: string, value: number | undefined) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDietaryPreferenceChange = (preference: string) => {
    setFormData((prev) => ({ ...prev, dietaryPreference: preference }));
  };

  const handleCuisinePreferenceChange = (preference: string) => {
    setFormData((prev) => ({ ...prev, cuisinePreference: preference }));
  };

  const handleAllergyChange = (allergy: string) => {
    setFormData((prev) => {
      const allergies = prev.allergies.includes(allergy)
        ? prev.allergies.filter((item) => item !== allergy)
        : [...prev.allergies, allergy];
      return { ...prev, allergies };
    });
  };

  const handleDaysChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, days: value[0] }));
  };

  const toggleInputMode = () => {
    setFormData((prev) => ({ 
      ...prev, 
      useNutritionInput: !prev.useNutritionInput,
      // Clear nutrition values when switching to basic mode
      ...(prev.useNutritionInput ? { 
        calories: undefined, 
        protein: undefined, 
        carbs: undefined, 
        fat: undefined, 
        fiber: undefined 
      } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-800">
            {(() => {
              switch (step) {
                case 1:
                  return formData.useNutritionInput ? "Nutrition Goals" : "Basic Information";
                case 2:
                  return "Dietary Preferences";
                case 3:
                  return "Plan Duration";
                default:
                  return "";
              }
            })()}
          </h2>
          <div className="text-sm text-gray-500">Step {step} of 3</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <motion.div
            className="bg-nutrition-green h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3].map((stepNumber) => (
            <button
              key={stepNumber}
              onClick={() => goToStep(stepNumber)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                step === stepNumber
                  ? "bg-nutrition-green text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {stepNumber}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <div className="space-y-6">
                {/* Input Mode Toggle */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium">Input Method</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Choose how you want to generate your diet plan
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="input-mode" className={!formData.useNutritionInput ? "text-nutrition-green font-medium" : "text-gray-500"}>
                        Basic Info
                      </Label>
                      <Switch 
                        id="input-mode" 
                        checked={formData.useNutritionInput} 
                        onCheckedChange={toggleInputMode} 
                      />
                      <Label htmlFor="input-mode" className={formData.useNutritionInput ? "text-nutrition-green font-medium" : "text-gray-500"}>
                        Nutrition Goals
                      </Label>
                    </div>
                  </div>
                </div>
                
                {formData.useNutritionInput ? (
                  <NutritionInput data={formData} onChange={handleNutritionChange} />
                ) : (
                  <div className="nutrition-card">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          min={18}
                          max={100}
                          value={formData.age}
                          onChange={(e) => handleNumberChange("age", e.target.value)}
                          className="nutrition-input mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">Years</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Label htmlFor="height">Height</Label>
                        <Input
                          id="height"
                          name="height"
                          type="number"
                          min={100}
                          max={250}
                          value={formData.height}
                          onChange={(e) => handleNumberChange("height", e.target.value)}
                          className="nutrition-input mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">Centimeters</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Label htmlFor="weight">Weight</Label>
                        <Input
                          id="weight"
                          name="weight"
                          type="number"
                          min={30}
                          max={300}
                          value={formData.weight}
                          onChange={(e) => handleNumberChange("weight", e.target.value)}
                          className="nutrition-input mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">Kilograms</p>
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="nutrition-card"
                >
                  <h3 className="text-lg font-medium mb-4">Dietary Preference</h3>
                  <RadioGroup
                    value={formData.dietaryPreference}
                    onValueChange={handleDietaryPreferenceChange}
                    className="space-y-4"
                  >
                    {DIETARY_PREFERENCES.map((preference, index) => (
                      <motion.div
                        key={preference.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.dietaryPreference === preference.id
                            ? "border-nutrition-green bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center">
                          <RadioGroupItem
                            value={preference.id}
                            id={`preference-${preference.id}`}
                            className="mr-3"
                          />
                          <Label
                            htmlFor={`preference-${preference.id}`}
                            className="cursor-pointer flex-grow"
                          >
                            {preference.label}
                          </Label>
                        </div>
                      </motion.div>
                    ))}
                  </RadioGroup>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="nutrition-card"
                >
                  <h3 className="text-lg font-medium mb-4">Cuisine Preference</h3>
                  <RadioGroup
                    value={formData.cuisinePreference}
                    onValueChange={handleCuisinePreferenceChange}
                    className="space-y-4"
                  >
                    {CUISINE_PREFERENCES.map((preference, index) => (
                      <motion.div
                        key={preference.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.cuisinePreference === preference.id
                            ? "border-nutrition-green bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center">
                          <RadioGroupItem
                            value={preference.id}
                            id={`cuisine-${preference.id}`}
                            className="mr-3"
                          />
                          <Label
                            htmlFor={`cuisine-${preference.id}`}
                            className="cursor-pointer flex-grow"
                          >
                            {preference.label}
                          </Label>
                        </div>
                      </motion.div>
                    ))}
                  </RadioGroup>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="nutrition-card"
                >
                  <h3 className="text-lg font-medium mb-4">Allergies</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {COMMON_ALLERGIES.map((allergy, index) => (
                      <motion.div
                        key={allergy.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * index }}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`allergy-${allergy.id}`}
                          checked={formData.allergies.includes(allergy.id)}
                          onCheckedChange={() => handleAllergyChange(allergy.id)}
                        />
                        <label
                          htmlFor={`allergy-${allergy.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {allergy.label}
                        </label>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="other-allergies">Other Allergies</Label>
                    <Input
                      id="other-allergies"
                      placeholder="Enter comma separated allergies"
                      className="nutrition-input mt-2"
                      onChange={(e) => {
                        const allergiesList = e.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter((item) => item);
                        setFormData((prev) => ({
                          ...prev,
                          allergies: [
                            ...COMMON_ALLERGIES.filter((allergy) =>
                              formData.allergies.includes(allergy.id)
                            ).map((a) => a.id),
                            ...allergiesList.filter(
                              (item) => !COMMON_ALLERGIES.map((a) => a.label.toLowerCase()).includes(item.toLowerCase())
                            ),
                          ],
                        }));
                      }}
                    />
                  </div>
                </motion.div>
              </div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="nutrition-card"
              >
                <h3 className="text-lg font-medium mb-6">How many days of meal plan do you need?</h3>
                
                <div className="px-4 py-10">
                  <Slider 
                    defaultValue={[formData.days]} 
                    max={30} 
                    min={1}
                    step={1}
                    onValueChange={handleDaysChange}
                    value={[formData.days]}
                  />
                  
                  <div className="mt-8 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Selected: <span className="font-medium text-nutrition-green">{formData.days} {formData.days === 1 ? 'Day' : 'Days'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDaysChange([Math.max(1, formData.days - 1)])}
                        className="w-8 h-8 p-0"
                      >
                        -
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDaysChange([Math.min(30, formData.days + 1)])}
                        className="w-8 h-8 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-6 gap-2">
                    {[1, 7, 14, 21, 28, 30].map((day) => (
                      <motion.button
                        key={day}
                        onClick={() => handleDaysChange([day])}
                        className={`p-2 rounded-lg text-sm transition-colors ${
                          formData.days === day
                            ? 'bg-nutrition-green text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {day} {day === 1 ? 'Day' : 'Days'}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-start">
                    <div className="bg-nutrition-green-light rounded-full p-2 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Your meal plan includes:</h4>
                      <ul className="mt-2 space-y-1 text-sm text-gray-600">
                        <li>• {formData.days} days of personalized meals</li>
                        <li>• Breakfast, lunch, dinner and snacks</li>
                        <li>• Nutrition information for each day</li>
                        <li>• Customized to your dietary needs</li>
                        <li>• Detailed recipes and ingredients</li>
                        <li>• Shopping list for each week</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="hover:bg-gray-100"
            >
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="ml-auto bg-nutrition-green hover:bg-nutrition-green-dark transition-colors"
            >
              Continue
            </Button>
          ) : (
            <div className="ml-auto space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="hover:bg-gray-100"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-nutrition-green hover:bg-nutrition-green-dark transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating Plan...
                  </div>
                ) : (
                  "Generate Meal Plan"
                )}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default MultiStepForm;
