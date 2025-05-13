import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface GoogleSignInButtonProps {
  onGoogleSignIn?: () => Promise<void>;
}

export const GoogleSignInButton = ({ onGoogleSignIn }: GoogleSignInButtonProps) => {
  const { signInWithGoogle, loading, error } = useAuth();

  const handleSignIn = async () => {
    try {
      if (onGoogleSignIn) {
        await onGoogleSignIn();
      } else {
        await signInWithGoogle();
      }
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
    >
      <img
        src="https://www.google.com/favicon.ico"
        alt="Google"
        className="w-5 h-5"
      />
      {loading ? "Signing in..." : "Sign in with Google"}
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </Button>
  );
}; 