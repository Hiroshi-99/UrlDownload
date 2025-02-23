
import { ArrowDownToLine } from "lucide-react";

export const Header = () => {
  return (
    <header className="w-full py-6 px-4 flex justify-center items-center">
      <div className="container max-w-7xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="w-6 h-6 text-primary" />
          <span className="text-xl font-semibold">MediaFlow</span>
        </div>
      </div>
    </header>
  );
};
