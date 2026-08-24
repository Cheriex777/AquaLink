import { MapPin } from 'lucide-react'
import { TextField } from '../fields'
import LocationPicker from '../../location/LocationPicker'
import type { StepProps } from './stepProps'

export default function Step1Property({ draft, errors, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
        <MapPin className="mt-0.5 size-5 shrink-0 text-primary-600" aria-hidden="true" />
        <div className="text-sm text-slate-600">
          <p className="font-medium text-slate-800">Property details</p>
          <p className="mt-0.5 text-xs">
            Detect your location with GPS, tap the map, drag the pin, or type
            coordinates manually — whichever works best.
          </p>
        </div>
      </div>

      <TextField
        id="propertyName"
        label="Property name"
        required
        value={draft.propertyName}
        onChange={(value) => onChange({ propertyName: value })}
        error={errors.propertyName}
        placeholder="e.g. Sharma Residence"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="city"
          label="City / Town"
          required
          value={draft.city}
          onChange={(value) => onChange({ city: value })}
          error={errors.city}
          placeholder="e.g. Nagpur"
        />
        <TextField
          id="state"
          label="State"
          required
          value={draft.state}
          onChange={(value) => onChange({ state: value })}
          error={errors.state}
          placeholder="e.g. Maharashtra"
        />
      </div>

      <TextField
        id="pincode"
        label="PIN code"
        value={draft.pincode}
        onChange={(value) => onChange({ pincode: value.replace(/\D/g, '').slice(0, 6) })}
        error={errors.pincode}
        hint="6 digits, optional"
        inputMode="numeric"
        placeholder="440010"
      />

      <LocationPicker
        latitude={draft.latitude}
        longitude={draft.longitude}
        latitudeError={errors.latitude}
        longitudeError={errors.longitude}
        onChange={(latitude, longitude) => onChange({ latitude, longitude })}
      />
    </div>
  )
}
