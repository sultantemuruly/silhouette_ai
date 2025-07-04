import React from 'react'

const ComingSoon = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 rounded-2xl shadow-lg p-8 my-8">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
        <circle cx="12" cy="12" r="10" fill="#e0e7ef"/>
        <path d="M12 8v4l2.5 2.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Coming Soon</h1>
      <p className="text-base text-slate-700 max-w-md text-center mb-6">
        We are currently waiting for Google approval to launch this feature. Thank you for your patience and support!
      </p>
      <span className="text-sm text-slate-500">
        — The Silhouette AI Team
      </span>
    </div>
  )
}

export default ComingSoon;