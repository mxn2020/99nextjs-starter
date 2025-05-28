
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
interface FormFieldErrorProps {
message?: string;
className?: string;
}
export function FormFieldError({ message, className }: FormFieldErrorProps) {
if (!message) return null;
return (
<div className={cn("flex items-center space-x-1 mt-1", className)}>
<AlertCircle className="h-3 w-3 text-destructive" />
<p className="text-sm text-destructive" role="alert">
{message}
</p>
</div>
);
}
