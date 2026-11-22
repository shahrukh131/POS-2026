import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

/**
 * Label + Input + description + validation message bound to a react-hook-form field.
 * Any extra props (type, placeholder, step, autoFocus…) are passed to the Input.
 *
 * @param {{
 *   control: import('react-hook-form').Control<any>,
 *   name: string,
 *   label: string,
 *   description?: string,
 * } & import('react').ComponentProps<'input'>} props
 */
export function FormTextField({ control, name, label, description, ...inputProps }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {/* `field` carries its own `disabled` (usually undefined), so merge it explicitly. */}
            <Input {...inputProps} {...field} disabled={inputProps.disabled || field.disabled} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
