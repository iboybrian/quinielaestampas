const SIZES = {
  xs:    { w: 'w-5',  src: 'w40' },
  sm:    { w: 'w-6',  src: 'w40' },
  md:    { w: 'w-8',  src: 'w40' },
  lg:    { w: 'w-9',  src: 'w40' },
  xl:    { w: 'w-12', src: 'w80' },
  '2xl': { w: 'w-16', src: 'w80' },
}

export default function Flag({ code, size = 'md', className = '' }) {
  const { w, src } = SIZES[size] ?? SIZES.md
  if (!code || code === '?') {
    return <span className={`inline-block ${w} aspect-[3/2] rounded-sm bg-white/10 ${className}`} />
  }
  return (
    <img
      src={`https://flagcdn.com/${src}/${code}.png`}
      alt=""
      className={`inline-block ${w} h-auto rounded-sm ${className}`}
      loading="lazy"
    />
  )
}
