import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import { DietPlan } from "@/types";
import { getUserPlans } from "@/services/planStorage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onPlanSelect?: (plan: DietPlan) => void;
}

const Header = ({ onPlanSelect }: HeaderProps) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [userPlans, setUserPlans] = useState<DietPlan[]>([]);
  const { user, signOut } = useAuth();
  const isLoggedIn = !!user;

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      const plans = getUserPlans();
      setUserPlans(plans);
    }
  }, [isLoggedIn, user]);

  const handleLogin = (email: string) => {
    setShowLogin(false);
    const plans = getUserPlans();
    setUserPlans(plans);
  };

  const handleRegister = (email: string) => {
    setShowRegister(false);
    const plans = getUserPlans();
    setUserPlans(plans);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem("userEmail");
      setUserPlans([]);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Taste Flow Logo" className="h-10 w-10" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-[#4CAF50]">Taste Flow</h1>
            <span className="text-sm text-[#8BC34A]">healthy foods</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              {userPlans.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      My Plans ({userPlans.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {userPlans.map((plan) => (
                      <DropdownMenuItem
                        key={plan.planId}
                        onClick={() => onPlanSelect?.(plan)}
                      >
                        {new Date(plan.createdAt).toLocaleDateString()} - {plan.userData.days} Day Plan
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <span className="text-gray-600">
                Welcome, {user.email}
              </span>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowLogin(true)}
              className="bg-nutrition-green hover:bg-nutrition-green-dark"
            >
              Login
            </Button>
          )}
        </div>
      </div>
      {showLogin && (
        <LoginForm
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}
      {showRegister && (
        <RegisterForm
          onRegister={handleRegister}
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </header>
  );
};

export default Header;
