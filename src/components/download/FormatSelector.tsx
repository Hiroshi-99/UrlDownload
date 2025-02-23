
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formats } from "./constants";

interface FormatSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const FormatSelector = ({ value, onValueChange, disabled }: FormatSelectorProps) => {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px] glass-effect border-none">
        <SelectValue placeholder="Select format" />
      </SelectTrigger>
      <SelectContent>
        {formats.map((format) => (
          <SelectItem key={format.value} value={format.value}>
            <div className="flex items-center gap-2">
              {format.icon}
              <span>{format.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {format.quality}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
