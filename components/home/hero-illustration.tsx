export function HeroIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      fill="none"
      className="w-full h-auto"
    >
      <rect width="800" height="600" rx="20" fill="#f1f5f9" className="dark:fill-gray-800" />

      {/* Background elements */}
      <circle cx="400" cy="300" r="250" fill="#e2e8f0" className="dark:fill-gray-700" />
      <circle cx="400" cy="300" r="200" fill="#f8fafc" className="dark:fill-gray-900" />

      {/* Document */}
      <rect
        x="250"
        y="150"
        width="300"
        height="400"
        rx="10"
        fill="white"
        className="dark:fill-gray-800"
        stroke="#cbd5e1"
        strokeWidth="2"
        className="dark:stroke-gray-600"
      />

      {/* Document header */}
      <rect x="250" y="150" width="300" height="60" rx="10" fill="#3b82f6" />
      <rect x="280" y="175" width="240" height="10" rx="5" fill="white" fillOpacity="0.7" />

      {/* Document content */}
      <rect x="280" y="230" width="240" height="10" rx="5" fill="#cbd5e1" className="dark:fill-gray-600" />
      <rect x="280" y="250" width="180" height="10" rx="5" fill="#cbd5e1" className="dark:fill-gray-600" />

      <rect x="280" y="290" width="240" height="10" rx="5" fill="#cbd5e1" className="dark:fill-gray-600" />
      <rect x="280" y="310" width="200" height="10" rx="5" fill="#cbd5e1" className="dark:fill-gray-600" />

      <rect x="280" y="350" width="240" height="10" rx="5" fill="#cbd5e1" className="dark:fill-gray-600" />
      <rect x="280" y="370" width="160" height="10" rx="5" fill="#cbd5e1" className="dark:fill-gray-600" />

      {/* Form fields */}
      <rect
        x="280"
        y="410"
        width="240"
        height="30"
        rx="5"
        fill="#f1f5f9"
        className="dark:fill-gray-700"
        stroke="#cbd5e1"
        strokeWidth="2"
        className="dark:stroke-gray-600"
      />
      <rect
        x="280"
        y="460"
        width="240"
        height="30"
        rx="5"
        fill="#f1f5f9"
        className="dark:fill-gray-700"
        stroke="#cbd5e1"
        strokeWidth="2"
        className="dark:stroke-gray-600"
      />

      {/* Submit button */}
      <rect x="380" y="510" width="140" height="30" rx="5" fill="#3b82f6" />
      <rect x="410" y="520" width="80" height="10" rx="5" fill="white" fillOpacity="0.7" />

      {/* Decorative elements */}
      <circle cx="150" cy="150" r="50" fill="#3b82f6" fillOpacity="0.2" />
      <circle cx="650" cy="450" r="70" fill="#3b82f6" fillOpacity="0.2" />
      <circle cx="700" cy="100" r="30" fill="#3b82f6" fillOpacity="0.2" />
      <circle cx="100" cy="500" r="40" fill="#3b82f6" fillOpacity="0.2" />

      {/* Floating icons */}
      <circle cx="200" cy="250" r="20" fill="#3b82f6" />
      <rect x="190" y="240" width="20" height="20" rx="2" fill="white" fillOpacity="0.7" />

      <circle cx="600" cy="200" r="20" fill="#3b82f6" />
      <rect x="590" y="190" width="20" height="20" rx="10" fill="white" fillOpacity="0.7" />

      <circle cx="650" cy="350" r="20" fill="#3b82f6" />
      <path d="M645 350L655 360M655 350L645 360" stroke="white" strokeWidth="2" strokeLinecap="round" />

      <circle cx="150" cy="400" r="20" fill="#3b82f6" />
      <path d="M145 400H155M150 395V405" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
