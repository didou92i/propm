import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  showStrengthIndicator?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrengthIndicator = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [strength, setStrength] = React.useState(0);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const calculateStrength = (password: string): number => {
      let score = 0;
      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
      return score;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const password = e.target.value;
      if (showStrengthIndicator) {
        setStrength(calculateStrength(password));
      }
      props.onChange?.(e);
    };

    const getStrengthLabel = () => {
      switch (strength) {
        case 0:
        case 1: return { label: "Faible", color: "text-destructive" };
        case 2:
        case 3: return { label: "Moyen", color: "text-amber-500" };
        case 4:
        case 5: return { label: "Fort", color: "text-green-500" };
        default: return { label: "", color: "" };
      }
    };

    const strengthInfo = getStrengthLabel();

    return (
      <div className="space-y-2">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={cn(
              "flex h-12 w-full rounded-lg border border-input bg-background pl-4 pr-12 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            {...props}
            onChange={handlePasswordChange}
            aria-describedby={showStrengthIndicator ? "password-strength" : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 hover:bg-transparent"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Eye className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </div>
        
        {showStrengthIndicator && props.value && (
          <div id="password-strength" className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Force du mot de passe :</span>
              <span className={cn("font-medium", strengthInfo.color)}>
                {strengthInfo.label}
              </span>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    level <= strength
                      ? strength <= 2
                        ? "bg-destructive"
                        : strength <= 3
                        ? "bg-amber-500"
                        : "bg-green-500"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Conseils pour un mot de passe fort :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li className={props.value && props.value.toString().length >= 8 ? "text-green-600" : ""}>
                  Au moins 8 caractères
                </li>
                <li className={props.value && /[A-Z]/.test(props.value.toString()) ? "text-green-600" : ""}>
                  Une lettre majuscule
                </li>
                <li className={props.value && /[0-9]/.test(props.value.toString()) ? "text-green-600" : ""}>
                  Un chiffre
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };