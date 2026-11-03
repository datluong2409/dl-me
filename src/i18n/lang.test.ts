import { LANG_STORAGE_KEY, detectLang, readStoredLang, resolveLang, writeStoredLang } from './lang'

describe('detectLang', () => {
  it('picks vi when it is the first supported language', () => {
    expect(detectLang(['vi-VN', 'en'])).toBe('vi')
  })

  it('picks en when en comes before vi', () => {
    expect(detectLang(['en-US', 'vi'])).toBe('en')
  })

  it('skips unsupported languages and takes the first supported one', () => {
    expect(detectLang(['fr', 'vi'])).toBe('vi')
  })

  it('falls back to en when nothing is supported', () => {
    expect(detectLang(['ja', 'fr'])).toBe('en')
  })

  it('is case-insensitive', () => {
    expect(detectLang(['VI'])).toBe('vi')
  })

  it('falls back to en for an empty or missing list', () => {
    expect(detectLang([])).toBe('en')
    expect(detectLang(undefined)).toBe('en')
  })
})

describe('resolveLang', () => {
  it('prefers a valid stored value over the browser languages', () => {
    expect(resolveLang('vi', ['en'])).toBe('vi')
  })

  it('ignores an unsupported stored value', () => {
    expect(resolveLang('fr', ['vi'])).toBe('vi')
  })

  it('uses detection when nothing is stored', () => {
    expect(resolveLang(null, ['en'])).toBe('en')
  })
})

describe('storage helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('uses the dl:lang key', () => {
    expect(LANG_STORAGE_KEY).toBe('dl:lang')
    writeStoredLang('vi')
    expect(localStorage.getItem('dl:lang')).toBe('vi')
    expect(readStoredLang()).toBe('vi')
  })

  it('returns null when reading throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(readStoredLang()).toBeNull()
  })

  it('does not throw when writing throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => writeStoredLang('en')).not.toThrow()
  })
})
