import type { ReactNode, SelectHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
      : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
  }`

function FieldShell({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  required?: boolean
  placeholder?: string
  type?: 'text' | 'number'
  inputMode?: 'decimal' | 'numeric'
  min?: number
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  placeholder,
  type = 'text',
  inputMode,
  min,
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        min={min}
        className={inputClass(Boolean(error))}
      />
    </FieldShell>
  )
}

export function NumberField(props: Omit<TextFieldProps, 'type' | 'inputMode'>) {
  return <TextField {...props} type="number" inputMode="decimal" />
}

interface SelectFieldProps extends Pick<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  error?: string
  hint?: string
  required?: boolean
  placeholderOption?: string
  icon?: LucideIcon
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
  hint,
  required,
  placeholderOption,
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`${inputClass(Boolean(error))} ${value === '' ? 'text-slate-400' : ''}`}
      >
        {placeholderOption ? (
          <option value="" disabled>
            {placeholderOption}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-slate-900">
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

interface RadioGroupFieldProps {
  legend: string
  name: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; description?: string }[]
  error?: string
  required?: boolean
}

export function RadioGroupField({
  legend,
  name,
  value,
  onChange,
  options,
  error,
  required,
}: RadioGroupFieldProps) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-slate-700">
        {legend}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        {options.map((option) => {
          const checked = value === option.value
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors ${
                checked
                  ? 'border-primary-600 bg-primary-50 text-primary-800 ring-1 ring-primary-600'
                  : error
                    ? 'border-red-300 bg-white hover:bg-slate-50'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span>
                <span className="block font-medium">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          )
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
