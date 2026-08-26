// The RentTa logo mark: a rooftop (the "venue" half of the artwork)
// sheltering a speaker + karaoke mic (the "event" half) - the same pairing
// as the provided brand artwork's house-with-mic-and-speaker icon, redrawn
// as a simplified glyph that stays legible at navbar size. Always uses the
// brand blue->green gradient (.brand-mark), independent of whatever an
// .icon-circle elsewhere on the page is currently themed as.
export default function BrandMark({ size = 32 }) {
  return (
    <span className="icon-circle brand-mark" style={{ width: size, height: size }}>
      <svg width="62%" height="62%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* Roofline + open walls, echoing the "house" outline in the artwork */}
        <path d="M3 11 12 4l9 7" />
        <path d="M5 10.3V19M19 10.3V19" />
        {/* Speaker cabinet (left) - rounded box with tweeter + woofer */}
        <rect x="6.3" y="12.4" width="4.3" height="6.3" rx="1" />
        <circle cx="8.45" cy="14.5" r="0.55" fill="currentColor" stroke="none" />
        <circle cx="8.45" cy="16.9" r="1.05" />
        {/* Karaoke mic (right) - capsule head + stand */}
        <circle cx="15.9" cy="14.4" r="1.7" fill="currentColor" stroke="none" />
        <path d="M15.9 16.3v2.7" />
      </svg>
    </span>
  );
}

// Two-tone wordmark matching the artwork's "Rent" (blue) + "Ta" (green)
// split, instead of a single flat color.
export function BrandWordmark({ size = 18 }) {
  return (
    <span style={{ fontWeight: 800, fontSize: size, letterSpacing: -0.2 }}>
      <span style={{ color: 'var(--color-primary-dark)' }}>Rent</span>
      <span style={{ color: 'var(--color-brand-green)' }}>Ta</span>
    </span>
  );
}
