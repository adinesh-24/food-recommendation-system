import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UtensilsCrossed, LogIn } from "lucide-react";

const Login = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get the redirect path from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get("redirect") || "/";
  
  useEffect(() => {
    // If user is already logged in, redirect to the specified path
    if (user) {
      navigate(`/${redirectPath}`);
    }
  }, [user, navigate, redirectPath]);
  
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome!",
        description: "You have successfully signed in.",
      });
    } catch (error) {
      console.error("Sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Sign-in Failed",
        description: "There was a problem signing you in. Please try again.",
      });
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-nutrition-green bg-opacity-10 mb-4">
            <UtensilsCrossed className="h-6 w-6 text-nutrition-green" />
          </div>
          <CardTitle className="text-2xl">Welcome to TasteFlow</CardTitle>
          <CardDescription>
            Sign in to save and access your personalized diet plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleSignIn}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
                <path
                  d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                  fill="#EA4335"
                />
                <path
                  d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                  fill="#4285F4"
                />
                <path
                  d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.0004 24C15.2404 24 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24 12.0004 24Z"
                  fill="#34A853"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          <p>
            Your data will be stored securely and used only to improve your experience
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login; 