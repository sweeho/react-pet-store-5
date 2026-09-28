import { cn } from "@/utils";

import type { LocaleId } from "../../../lib/locale/model";
import { getStateProvinceOptions } from "../../../lib/locale/stateProvince";

export interface StateProvinceSelectProps {
  locale: LocaleId;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function StateProvinceSelect({ locale, name, value, onChange }: StateProvinceSelectProps) {
  const options = getStateProvinceOptions(locale);
  const groupId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={name}
      id={groupId}
      className="border-line-2 overflow-hidden rounded-lg border"
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange?.(option.value)}
            className={cn(
              "flex h-10 w-full items-center px-3.5 text-left",
              checked ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
