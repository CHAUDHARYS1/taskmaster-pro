export const isDesktop = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
