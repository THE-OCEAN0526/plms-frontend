export const PMSLogo = ({ size = 40 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* 使用深靛紫 (#4338CA) 到 亮紫羅蘭 (#A855F7) 的漸層 */}
      <linearGradient id="pmsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4338CA" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
    </defs>
    
    {/* 幾何六角方塊：象徵財產儲存 */}
    <path 
      d="M50 10L15 30V70L50 90L85 70V30L50 10Z" 
      fill="url(#pmsGradient)" 
      fillOpacity="0.9"
    />
    
    {/* P 字幾何線條 */}
    <path 
      d="M40 35H58C63 35 67 39 67 44C67 49 63 53 58 53H40V65" 
      stroke="white" 
      strokeWidth="6" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* 琥珀金節點 (#F59E0B)：代表資訊傳播與追蹤點 */}
    <circle cx="75" cy="25" r="7" fill="#F59E0B" />
    <circle cx="75" cy="25" r="11" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="2" />
  </svg>
);

