'use client';

import { useState } from 'react';
import { Loader2, MapPin, Image as ImageIcon, Clock, Tag } from 'lucide-react';
import { Venue, Sport, SkillLevel } from '@/shared/types';
import { cn } from '@/shared/helpers/utils';

export type VenueFormData = Omit<Venue, 'id' | 'createdAt' | 'rating' | 'reviewCount' | 'category' | 'peakPricing' | 'ownerId' | 'source' | 'approvalStatus'>;

interface VenueFormProps {
  initialData?: Partial<VenueFormData>;
  onSubmit: (data: VenueFormData) => Promise<void>;
  onCancel: () => void;
  mode: 'add' | 'edit';
}

const SPORTS: { value: Sport; label: string; emoji: string }[] = [
  { value: 'badminton', label: 'Badminton', emoji: '🏸' },
  { value: 'football', label: 'Football', emoji: '⚽' },
  { value: 'swimming', label: 'Swimming', emoji: '🏊' },
  { value: 'kabaddi', label: 'Kabaddi', emoji: '🤼' },
];

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all', label: 'All Levels' },
];

const AREAS = [
  'Gomti Nagar', 'Gomti Nagar Extension', 'Aliganj', 'Hazratganj',
  'Indira Nagar', 'Chowk', 'Ashiyana', 'Sultanpur Road', 'Aishbagh',
  'Jankipuram', 'Vibhuti Khand', 'Mahanagar', 'Kaiserbagh'
];

const AMENITY_OPTIONS = [
  'Parking', 'Changing Rooms', 'Showers', 'Floodlights',
  'AC', 'Cafeteria', 'Equipment Rental', 'Drinking Water',
  'First Aid', 'Wi-Fi', 'Spectator Seating', 'Coaching',
];

const DEFAULT_FORM: VenueFormData = {
  name: '',
  sport: 'badminton',
  area: 'Gomti Nagar',
  address: '',
  coordinates: { lat: 26.8467, lng: 80.9462 },
  price: 300,
  amenities: [],
  skillLevel: 'all',
  timings: { open: '06:00 AM', close: '10:00 PM' },
  description: '',
  imageUrl: '',
  available: true,
  tags: [],
};

export function VenueForm({ initialData, onSubmit, onCancel, mode }: VenueFormProps) {
  const [form, setForm] = useState<VenueFormData>({ ...DEFAULT_FORM, ...initialData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  const update = <K extends keyof VenueFormData>(key: K, value: VenueFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), tagInput.trim()],
    }));
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: (prev.tags || []).filter((t) => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.imageUrl || !form.description) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (err) {
      console.error('Venue form error:', err);
      setError('Failed to save venue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border-2 border-red-500 rounded-md px-4 py-3 text-red-400 text-sm font-bold">
          {error}
        </div>
      )}

      {/* Venue Name */}
      <div>
        <label htmlFor="venue-name" className="field-label">Venue Name *</label>
        <input
          id="venue-name"
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="e.g. Gomti Nagar Badminton Academy"
          title="Venue Name"
          required
          className="w-full"
        />
      </div>

      {/* Sport + Skill Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Sport *</label>
          <div className="grid grid-cols-2 gap-2">
            {SPORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => update('sport', s.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-md border-2 border-black text-sm font-bold transition-all shadow-[2px_2px_0px_#000]',
                  form.sport === s.value
                    ? 'bg-cyan-400 text-black shadow-[1px_1px_0px_#000] translate-x-0.5 translate-y-0.5'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                )}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">Skill Level *</label>
          <div className="grid grid-cols-2 gap-2">
            {SKILL_LEVELS.map((sl) => (
              <button
                key={sl.value}
                type="button"
                onClick={() => update('skillLevel', sl.value)}
                className={cn(
                  'px-3 py-2.5 rounded-md border-2 border-black text-sm font-bold transition-all shadow-[2px_2px_0px_#000]',
                  form.skillLevel === sl.value
                    ? 'bg-cyan-400 text-black shadow-[1px_1px_0px_#000] translate-x-0.5 translate-y-0.5'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                )}
              >
                {sl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Area + Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="venue-area" className="field-label flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Area *</label>
          <select
            id="venue-area"
            title="Select Area"
            value={form.area}
            onChange={(e) => update('area', e.target.value)}
            className="w-full border-2 border-black rounded-md px-4 py-2.5 text-sm shadow-[2px_2px_0px_#000]"
          >
            {AREAS.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="venue-address" className="field-label">Full Address *</label>
          <input
            id="venue-address"
            type="text"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Street address"
            title="Full Address"
            required
            className="w-full"
          />
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label htmlFor="venue-image" className="field-label flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> Image URL *</label>
        <input
          id="venue-image"
          type="url"
          value={form.imageUrl}
          onChange={(e) => update('imageUrl', e.target.value)}
          placeholder="https://example.com/venue-image.jpg"
          title="Image URL"
          required
          className="w-full"
        />
        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imageUrl} alt="preview" className="mt-2 h-24 w-full object-cover rounded-md border-2 border-black" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
        )}
      </div>

      {/* Price */}
      <div>
        <label htmlFor="venue-price" className="field-label">Price per Hour (₹) *</label>
        <input
          id="venue-price"
          type="number"
          value={form.price}
          onChange={(e) => update('price', Number(e.target.value))}
          min={50}
          max={5000}
          placeholder="e.g. 250"
          title="Price per Hour"
          required
          className="w-full"
        />
      </div>

      {/* Timings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="venue-open" className="field-label flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Opening Time *</label>
          <input
            id="venue-open"
            type="text"
            value={form.timings.open}
            onChange={(e) => update('timings', { ...form.timings, open: e.target.value })}
            placeholder="06:00 AM"
            title="Opening Time"
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="venue-close" className="field-label">Closing Time *</label>
          <input
            id="venue-close"
            type="text"
            value={form.timings.close}
            onChange={(e) => update('timings', { ...form.timings, close: e.target.value })}
            placeholder="10:00 PM"
            title="Closing Time"
            className="w-full"
          />
        </div>
      </div>

      {/* Google Maps Coordinates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="venue-lat" className="field-label">Latitude</label>
          <input
            id="venue-lat"
            type="number"
            step="any"
            value={form.coordinates.lat}
            onChange={(e) => update('coordinates', { ...form.coordinates, lat: Number(e.target.value) })}
            placeholder="26.8467"
            title="Latitude"
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="venue-lng" className="field-label">Longitude</label>
          <input
            id="venue-lng"
            type="number"
            step="any"
            value={form.coordinates.lng}
            onChange={(e) => update('coordinates', { ...form.coordinates, lng: Number(e.target.value) })}
            placeholder="80.9462"
            title="Longitude"
            className="w-full"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="venue-description" className="field-label">Description *</label>
        <textarea
          id="venue-description"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Describe your venue, facilities, unique features..."
          title="Description"
          rows={4}
          required
          className="w-full border-2 border-black rounded-md px-4 py-3 text-sm placeholder-slate-500 shadow-[2px_2px_0px_#000] focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Amenities */}
      <div>
        <label className="field-label">Amenities</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {AMENITY_OPTIONS.map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border-2 border-black text-xs font-bold transition-all',
                form.amenities.includes(amenity)
                  ? 'bg-emerald-400 text-black shadow-[1px_1px_0px_#000]'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 shadow-[2px_2px_0px_#000]'
              )}
            >
              {form.amenities.includes(amenity) ? '✓' : '+'} {amenity}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="field-label flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Tags (optional)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="e.g. Synthetic Court, Air-Cooled"
            className="flex-1"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 bg-slate-900 border-2 border-black rounded-md text-xs font-bold text-slate-200 hover:bg-slate-800 shadow-[2px_2px_0px_#000] transition-all"
          >
            Add
          </button>
        </div>
        {(form.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(form.tags || []).map((tag) => (
              <span key={tag} className="flex items-center gap-1.5 bg-indigo-500 text-black text-xs font-bold px-3 py-1.5 rounded-md border-2 border-black shadow-[2px_2px_0px_#000]">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-black hover:text-red-800">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Availability Toggle */}
      <div className="flex items-center justify-between glass rounded-md p-4 border-2 border-black">
        <div>
          <div className="font-bold text-slate-200 text-sm">Venue Availability</div>
          <div className="text-slate-400 text-xs">Players can discover and book this venue</div>
        </div>
        <button
          type="button"
          onClick={() => update('available', !form.available)}
          title="Toggle Availability"
          aria-label="Toggle Availability"
          className={cn(
            'w-14 h-7 rounded-full border-2 border-black transition-all shadow-[2px_2px_0px_#000] relative',
            form.available ? 'bg-emerald-400' : 'bg-slate-900'
          )}
        >
          <div className={cn(
            'w-5 h-5 bg-black rounded-full absolute top-0.5 transition-all',
            form.available ? 'left-7' : 'left-1'
          )} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-slate-800 border-2 border-black rounded-md text-slate-300 font-bold hover:bg-slate-700 transition-all shadow-[3px_3px_0px_#000]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn-primary justify-center py-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'add' ? '✓ Add Venue' : '✓ Save Changes'}
        </button>
      </div>
    </form>
  );
}
