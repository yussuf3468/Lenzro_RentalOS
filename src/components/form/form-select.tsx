import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SelectOption {
  value: string;
  label: string;
}

const NONE = '__none__';
const ALL = '__all__';

interface FormSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  options: SelectOption[];
  placeholder?: string;
  /** When set, renders an item representing the empty ('') value (e.g. "No category"). */
  emptyLabel?: string;
  id?: string;
  className?: string;
}

/** Accessible select wired to React Hook Form. */
export function FormSelect<T extends FieldValues>({
  control,
  name,
  options,
  placeholder,
  emptyLabel,
  id,
  className,
}: FormSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value = (field.value as string | undefined) ?? '';
        return (
          <Select
            value={value === '' ? (emptyLabel ? NONE : undefined) : value}
            onValueChange={(next) => field.onChange(next === NONE ? '' : next)}
          >
            <SelectTrigger id={id} className={className}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {emptyLabel ? <SelectItem value={NONE}>{emptyLabel}</SelectItem> : null}
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }}
    />
  );
}

interface SimpleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Label for the "show everything" ('') option (e.g. "All statuses"). */
  allLabel?: string;
  placeholder?: string;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

/** Accessible select for plain (non-form) state such as filters. */
export function SimpleSelect({
  value,
  onChange,
  options,
  allLabel,
  placeholder,
  id,
  className,
  ariaLabel,
}: SimpleSelectProps) {
  return (
    <Select
      value={value === '' ? (allLabel ? ALL : undefined) : value}
      onValueChange={(next) => onChange(next === ALL ? '' : next)}
    >
      <SelectTrigger id={id} className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allLabel ? <SelectItem value={ALL}>{allLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
