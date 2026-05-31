'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Copy, Check, Upload, Loader2, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';
import { Booking } from '@/shared/types';
import { getBookingById, getVenueById, submitPaymentProof, getUserProfile } from '@/backend/firebase/firestore';
import { formatCurrency } from '@/shared/helpers/utils';

export default function BookingPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Payout info
  const [upiId, setUpiId] = useState('playsphere@upi');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!id) return;
    
    let active = true;

    async function loadData() {
      try {
        const dbBooking = await getBookingById(id);
        if (!active) return;
        
        if (!dbBooking) {
          setError('Booking not found');
          setLoading(false);
          return;
        }
        
        setBooking(dbBooking);

        // Fetch venue to get UPI / QR details or owner's profile details
        const dbVenue = await getVenueById(dbBooking.venueId);
        if (dbVenue) {
          // Determine UPI ID and QR Code from venue or owner profile
          if (dbVenue.upiId) {
            setUpiId(dbVenue.upiId);
            if (dbVenue.qrCodeUrl) {
              setQrCodeUrl(dbVenue.qrCodeUrl);
            }
          } else {
            // Fallback: try owner's profile
            const ownerProfile = await getUserProfile(dbVenue.ownerId);
            if (active && ownerProfile) {
              if (ownerProfile.upiId) {
                setUpiId(ownerProfile.upiId);
              }
              if (ownerProfile.qrCodeUrl) {
                setQrCodeUrl(ownerProfile.qrCodeUrl);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading payment details:', err);
        if (active) setError('Failed to load booking details.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [id]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    // Validation
    if (!utrNumber.trim()) {
      setError('UTR/Transaction ID is required.');
      return;
    }

    if (utrNumber.trim().length < 6) {
      setError('Please enter a valid UTR number (at least 6 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // If screenshot is not set, use a simulated mock URL
      const finalScreenshot = screenshotBase64 || `https://placehold.co/600x400/1e293b/a5f3fc?text=UTR+${utrNumber}`;
      
      await submitPaymentProof(booking.bookingId, utrNumber, finalScreenshot);
      router.push('/dashboard');
    } catch (err) {
      console.error('Error submitting payment proof:', err);
      setError('Failed to submit payment details. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Loading secure payment screen...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="max-w-md w-full glass p-8 rounded-lg text-center border-2 border-black">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-slate-200 mb-2">Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link href="/dashboard" className="btn-secondary">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  // Generate dynamic QR code if no owner QR code URL is configured
  const finalQrUrl = qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=PlaySphere&am=${booking.amount}&cu=INR`)}`;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="p-2 bg-slate-900 rounded-md border border-black hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-200 tracking-tight">Complete Payment</h1>
            <p className="text-slate-400 text-xs mt-0.5">Booking ID: {booking.bookingId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Left: QR Code & UPI details (3 cols) */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Booking Summary */}
            <div className="glass rounded-lg p-5 border border-black/40">
              <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">Booking Summary</h2>
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Venue</span>
                  <span className="text-slate-200 font-semibold text-sm">{booking.venueName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Date</span>
                  <span className="text-slate-200 font-medium text-sm">{booking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Time Slot</span>
                  <span className="text-slate-200 font-medium text-sm">{booking.slot}</span>
                </div>
                <div className="h-px bg-black/40 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Amount Due</span>
                  <span className="text-cyan-400 font-extrabold text-lg">{formatCurrency(booking.amount)}</span>
                </div>
              </div>
            </div>

            {/* UPI Details */}
            <div className="glass rounded-lg p-6 border-2 border-black flex flex-col items-center">
              <h2 className="font-display font-bold text-slate-200 text-base mb-4 text-center">Scan to Pay using UPI</h2>
              
              {/* QR Image */}
              <div className="bg-white p-3 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={finalQrUrl} 
                  alt="UPI QR Code" 
                  className="w-44 h-44 object-contain"
                  onError={() => {
                    // Fallback to local styling if API fails
                    setQrCodeUrl('https://placehold.co/200x200/ffffff/000000?text=Scan+to+Pay');
                  }}
                />
              </div>
 
              {/* UPI ID Copy Field */}
              <div className="w-full">
                <label htmlFor="upi-address" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 text-center">UPI Address</label>
                <div className="flex bg-slate-900 border-2 border-black rounded-md overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <input 
                    id="upi-address"
                    type="text" 
                    readOnly 
                    value={upiId} 
                    title="UPI Address"
                    placeholder="UPI Address"
                    className="bg-transparent border-0 px-3 py-2 text-sm text-slate-200 font-mono flex-grow focus:outline-none focus:ring-0"
                  />
                  <button 
                    type="button" 
                    onClick={handleCopyUPI}
                    className="bg-cyan-400 text-black px-4 font-bold text-xs hover:bg-cyan-300 transition-colors flex items-center gap-1 border-l-2 border-black"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-5 text-[11px] text-slate-500 text-center leading-relaxed">
                Scan the QR code with any UPI app (GPay, PhonePe, Paytm) or copy the UPI address to complete the payment of <strong className="text-cyan-400">{formatCurrency(booking.amount)}</strong>.
              </div>
            </div>

          </div>

          {/* Right: Submit Proof Form (2 cols) */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="glass rounded-lg p-6 border-2 border-black space-y-5 sticky top-24">
              <h2 className="font-display font-bold text-slate-200 text-base">Submit Payment Proof</h2>
              
              {error && (
                <div className="bg-rose-500/20 border border-rose-500/50 rounded-md p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
 
              {/* UTR Input */}
              <div>
                <label htmlFor="utr-number" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  UTR / Transaction ID <span className="text-rose-400">*</span>
                </label>
                <input 
                  id="utr-number"
                  type="text"
                  required
                  placeholder="e.g. 12-digit UPI Ref No."
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Enter the 12-digit number from your payment confirmation screen.</p>
              </div>
 
              {/* Screenshot Upload */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Upload Screenshot <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative border-2 border-dashed border-black hover:border-cyan-400/40 rounded-md p-4 bg-slate-900 transition-colors text-center cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Upload Payment Screenshot"
                  />
                  {screenshotBase64 ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={screenshotBase64} 
                        alt="Screenshot Preview" 
                        className="w-full max-h-24 object-contain mx-auto rounded border border-black/40"
                      />
                      <p className="text-[10px] text-cyan-400 font-bold truncate">File selected. Click/Drag to change.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 text-slate-500 mx-auto group-hover:text-cyan-400 transition-colors" />
                      <p className="text-xs text-slate-300 font-medium">Select payment screenshot</p>
                      <p className="text-[9px] text-slate-500">Supports JPG, PNG, WebP</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full btn-primary justify-center py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Submit Verification Request'
                )}
              </button>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>The owner will verify your UTR to issue your ticket.</span>
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
