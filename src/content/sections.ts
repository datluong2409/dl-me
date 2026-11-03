export const SECTION_IDS = ['hero', 'about', 'skills', 'projects', 'experience', 'contact'] as const

export type SectionId = (typeof SECTION_IDS)[number]
