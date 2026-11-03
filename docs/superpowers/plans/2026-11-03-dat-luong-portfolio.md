# Dat Luong Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng landing page xin việc song ngữ EN/VI cho Dat Luong, nơi nhiều con trỏ có tên cùng "lắp ráp" từng section khi người xem cuộn tới.

**Architecture:** Nội dung React nằm sẵn trong DOM. Lõi `Director` (TypeScript thuần, không phụ thuộc React) nhận trigger theo vị trí cuộn, giao element cho các agent, chạy cử chỉ `draw`/`drop`, rồi chốt về trạng thái cuối. Lớp keo React (`AssemblyProvider`, `Section`, `useAssemble`) đăng ký element; overlay con trỏ ghi toạ độ thẳng vào DOM, không re-render React mỗi frame.

**Tech Stack:** Vite, React 19, TypeScript (strict), Tailwind CSS v4, Motion (`animate` từ `"motion"`), `@phosphor-icons/react`, `@fontsource/ibm-plex-sans`, `@fontsource/jetbrains-mono`, Vitest + Testing Library + jsdom, deploy Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-11-03-dat-luong-portfolio-design.md`

## Global Constraints

Mọi task đều phải tuân thủ các mục dưới đây (giá trị chép nguyên từ spec).

- Dự án đặt ở thư mục gốc `D:\p\dl-me`; build `npm run build`, output `dist`. Làm trên nhánh `feat/portfolio`, không làm trên `main`.
- Không bao giờ `git add -A` hoặc `git add .`; luôn thêm đường dẫn cụ thể (`.claude/` và `.codegraph/` không thuộc dự án). Mọi commit message kết thúc bằng dòng `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Token màu: `--bg #0A0D12`, `--surface #11161D`, `--border #232C3A`, `--fg #F1F5F9`, `--fg-muted #94A3B8`, `--accent #22C55E` (chữ trên accent dùng `--bg`), `--ring #F1F5F9`. Focus ring 2px, offset 2px. Chỉ một theme tối, `color-scheme: dark`. Mọi cặp chữ/nền ≥ 4.5:1.
- Sáu agent: mai `#FF6B6B`, kai `#38BDF8`, linh `#A78BFA`, alex `#FBBF24`, sora `#F472B6`, minh `#2DD4BF`. Viewport < 768px chỉ dùng 3 agent đầu (mai, kai, linh).
- Font: IBM Plex Sans (nội dung, tiêu đề), JetBrains Mono (nhãn, chip, tên con trỏ); self-host `@fontsource`, subset `latin`, `latin-ext`, `vietnamese`, `font-display: swap`.
- Icon: Phosphor, một bộ, một độ dày nét; không emoji làm icon. Khoảng cách theo bội số 4/8; container tối đa 1120px; padding ngang 16/24/32px; bán kính 12px (card), 999px (chip, pill); không đổ bóng; `min-height: 100dvh`, không dùng `100vh`.
- Chỉ animate `transform` và `opacity` trên element thật; ghost box nằm trong overlay. Không re-render React mỗi frame. Overlay `position: absolute; inset: 0; overflow: clip; pointer-events: none; aria-hidden="true"; z-index: 50` (nav 40, panel menu mobile 60), toạ độ là toạ độ tài liệu.
- Ngưỡng kích hoạt `0.35 × min(chiều cao section, chiều cao viewport)`; mỗi section ≤ 10 item; mỗi section chỉ chạy một lần; section mới kích hoạt nhất thắng, section đang chạy được chốt ngay.
- Ngôn ngữ: `localStorage['dl:lang']` (bọc try/catch) → `detectLang(navigator.languages)` → `en`; cập nhật `<html lang>` và `document.title`; nút EN | VI là `button` có `aria-pressed`. Mọi chuỗi hiển thị nằm trong `src/content/profile.ts` hoặc `src/i18n/messages.ts`, dạng `{ en, vi }`. Tiếng Việt xưng "tôi". Chuỗi placeholder bắt đầu bằng `TODO`.
- Truy cập: vùng bấm ≥ 44×44px trên mobile, khoảng cách ≥ 8px; không cuộn ngang ở 375px; một `<h1>`; heading tuần tự; `prefers-reduced-motion` tắt con trỏ, ẩn-pending, smooth scroll.
- **Styling chỉ bằng class Tailwind** (yêu cầu của chủ dự án, thêm giữa lúc thực thi). Không viết luật CSS có selector. File `.css` chỉ được chứa `@import`, `@source` và khối `@theme` (token, keyframes); `src/styles/no-custom-css.test.ts` kiểm tra điều này. Trạng thái động dùng variant (`motion-safe:`, `group-data-[...]:`, `data-[...]:`, `[&_...]:`); giá trị tính toán lúc chạy dùng `style` nội tuyến. Tailwind chỉ quét `index.html` và `src` (`source(none)`), không quét `.claude/`.
- Ngân sách: JS ban đầu ≤ 150 KB gzip; CLS < 0.1.

## Review Focus

Những tình huống spec ngầm đòi hỏi nhưng không nêu rõ; mỗi dòng có test ở task chủ.

1. `localStorage` ném lỗi (chế độ riêng tư) hoặc chứa giá trị không hỗ trợ như `"fr"`: trang vẫn hiển thị bằng ngôn ngữ phát hiện được. (Task 2)
2. `navigator.languages` rỗng hoặc `undefined`: dùng tiếng Anh. (Task 2)
3. Element bị React gỡ khỏi DOM giữa lúc con trỏ đang xử lý: không ném lỗi, agent được giải phóng, section vẫn hoàn tất. (Task 5)
4. Element có kích thước 0 (`display: none` ở breakpoint đó) hoặc section không có item: không làm kẹt section; coi như xong ngay, không có chuyến bay thừa. (Task 5)
5. URL ảnh người dùng cung cấp bị 404: hiện khung placeholder thay vì icon ảnh hỏng, không dịch layout. (Task 9)

## Điều chỉnh so với spec (cần báo lại cho chủ dự án)

- **Tắt JS:** spec §6.5/§10 nói tắt JS vẫn thấy đủ sáu section. Không thực hiện được với React render phía client (prerender nằm ngoài phạm vi). Plan thêm khối `<noscript>` tĩnh trong `index.html` (tên, vai trò, email, LinkedIn, GitHub) và kiểm tra mục này thay cho "đủ sáu section".
- **Kích hoạt:** dùng đánh giá theo cuộn/đổi kích thước (rAF throttle) kết hợp `ResizeObserver`, thay cho `IntersectionObserver` theo ngưỡng, vì quy tắc `0.35 × min(h, vh)` không biểu diễn được bằng ngưỡng IO cố định. Section nằm hoàn toàn phía trên viewport mà còn `pending` luôn được chốt ngay, kể cả khi chưa từng kích hoạt (để cuộn ngược không gặp nội dung ẩn).
- `CursorView.setSelection(el, agent)`: `el` bắt buộc khác null; `agent = null` để xóa viền (nhiều agent giữ item cùng lúc nên một hàm "xóa viền duy nhất" không đủ).
- Thêm watchdog `gestureTimeout` 4000ms: cử chỉ không kết thúc thì item bị chốt, để nội dung không bao giờ kẹt ẩn.
- Khi một item `done`, engine xóa các thuộc tính cụ thể (`opacity`, `transform`, `outline`, `outline-offset`, `--ax`, `--ay`) thay vì xóa toàn bộ `style`, để không đè style do React đặt.
- Tên token Tailwind v4: `--color-bg`, `--color-surface`, `--color-border`, `--color-fg`, `--color-fg-muted`, `--color-accent`, `--color-ring` (cùng giá trị như spec).
- File phụ ngoài danh sách spec: `cursors/types.ts`, `cursors/animate.ts`, `cursors/gestures/travel.ts`, `cursors/cursor-view.ts`, `cursors/observers.ts`, `cursors/context.ts`, `cursors/Section.tsx`, `cursors/usePresence.ts`, `content/sections.ts`.
- Số agent chốt lúc mount (không đổi giữa chừng khi resize qua mốc 768px).

## Bản đồ file

```
index.html  package.json  tsconfig.json  vite.config.ts  .gitignore  README.md
scripts/check-bundle.mjs
public/            _headers  favicon.svg  robots.txt  og.png
src/main.tsx  App.tsx
src/test/setup.ts
src/styles/        tokens.css  global.css  (chỉ @import/@theme/@source; test no-custom-css.test.ts)
src/i18n/          lang.ts  messages.ts  LangProvider.tsx
src/content/       sections.ts  profile.ts
src/cursors/       types.ts agents.ts motion-tokens.ts scheduler.ts path.ts animate.ts idle.ts
                   director.ts cursor-view.ts observers.ts context.ts
                   AssemblyProvider.tsx Section.tsx useAssemble.ts usePresence.ts
                   gestures/{travel,draw,drop}.ts
src/components/    Photo Card Chip SectionHeading LangToggle PresenceBar Nav Footer (.tsx)
src/sections/      Hero About Skills Projects Experience Contact (.tsx)
```

Mỗi file có test đi kèm cùng tên `.test.ts(x)`, trừ file chỉ chứa CSS/cấu hình.

---

### Task 1: Khung dự án, token, font

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`, `src/styles/tokens.css`, `src/styles/global.css`
- Test: `src/styles/tokens.test.ts`, `src/App.test.tsx`

**Interfaces:**
- Produces: CSS custom property `--color-*` (xem Global Constraints), script `npm run dev|build|preview|test|typecheck|check:bundle|verify`, test setup stub `window.matchMedia` (mặc định `matches: false`) và `ResizeObserver` (no-op).

- [ ] **Step 1: Tạo nhánh.** `git switch -c feat/portfolio`.
- [ ] **Step 2: Viết test thất bại.**
  - `tokens.test.ts` đọc `src/styles/tokens.css` bằng `fs`, regex `--color-([\w-]+):\s*(#[0-9A-Fa-f]{6})`, và `expect` bảy giá trị đúng bằng bảng token trong Global Constraints.
  - `App.test.tsx`: `render(<App />)` có link tên "Skip to content" trỏ `#content` và phần tử `main#content`.
- [ ] **Step 3: Chạy test, phải FAIL.** `npx vitest run` (chưa có cấu hình nên lỗi là mong đợi).
- [ ] **Step 4: Cài đặt và tạo khung.**
  - `npm init -y`; cài `react react-dom motion @phosphor-icons/react @fontsource/ibm-plex-sans @fontsource/jetbrains-mono`; dev: `vite @vitejs/plugin-react typescript tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom` (bản ổn định mới nhất).
  - `package.json` scripts: `dev: vite`, `build: tsc --noEmit && vite build`, `preview: vite preview`, `test: vitest run`, `typecheck: tsc --noEmit`, `check:bundle: node scripts/check-bundle.mjs`, `verify: npm run typecheck && npm test && npm run build && npm run check:bundle`.
  - `vite.config.ts`: plugin react + `@tailwindcss/vite`; `test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'] }`; `build.target: 'es2022'`.
  - `tsconfig.json`: `strict`, `jsx: react-jsx`, `moduleResolution: bundler`, `types: ["vitest/globals", "@testing-library/jest-dom"]`, `include: ["src", "vite.config.ts"]`.
  - `tokens.css`: khối `@theme { --color-bg … --color-ring … --font-sans: 'IBM Plex Sans', system-ui, sans-serif; --font-mono: 'JetBrains Mono', ui-monospace, monospace; }`.
  - `global.css`: `@import "tailwindcss"; @import "./tokens.css";`, import `@fontsource` cho Plex 400/500/600 và JetBrains Mono 400/500 ở ba subset `latin`, `latin-ext`, `vietnamese`; `html { background: var(--color-bg); color-scheme: dark; }`; `body` dùng màu `fg`, font `sans`, 16px, line-height 1.6; `:focus-visible` outline 2px offset 2px màu `ring`; `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth } }`; `section { scroll-margin-top: var(--nav-h) }` với `--nav-h: 64px`; lớp `.skip-link` (ẩn ngoài màn hình, hiện khi focus).
  - `index.html`: `<html lang="en">`, viewport `width=device-width, initial-scale=1`, `<meta name="color-scheme" content="dark">`, script nội tuyến **trước** mọi stylesheet: `document.documentElement.classList.add('js')`, `<div id="root">`, `<script type="module" src="/src/main.tsx">`.
  - `App.tsx` là khung tạm (skip link + `<main id="content" />`); `main.tsx` render `<App />` (không bọc `StrictMode` ở đây; Task 8 tự xử lý idempotent).
  - `.gitignore`: `node_modules`, `dist`, `*.local`.
- [ ] **Step 5: Kiểm tra font.** Chạy `ls node_modules/@fontsource/ibm-plex-sans/files | grep vietnamese` và tương tự cho `jetbrains-mono`. Expected: có file `woff2` subset vietnamese ở cả hai gói. Nếu thiếu, ghi lại trong README (Task 13) và chọn font dự phòng có hỗ trợ tiếng Việt.
- [ ] **Step 6: Chạy test và build.** `npx vitest run` → PASS; `npm run build` → thành công.
- [ ] **Step 7: Commit.** `git add package.json package-lock.json tsconfig.json vite.config.ts .gitignore index.html src docs && git commit -m "chore: scaffold Vite React app with tokens and fonts"`.

---

### Task 2: i18n (ngôn ngữ, chuỗi giao diện, provider)

**Files:**
- Create: `src/i18n/lang.ts`, `src/i18n/messages.ts`, `src/i18n/LangProvider.tsx`
- Test: `src/i18n/lang.test.ts`, `src/i18n/LangProvider.test.tsx`

**Interfaces:**
- Produces (`lang.ts`): `type Lang = 'en' | 'vi'`; `type Localized<T = string> = Record<Lang, T>`; `const LANG_STORAGE_KEY = 'dl:lang'`; `detectLang(languages: readonly string[] | undefined): Lang`; `resolveLang(stored: string | null, languages: readonly string[] | undefined): Lang`; `readStoredLang(): string | null` và `writeStoredLang(lang: Lang): void` (đều nuốt lỗi storage).
- Produces (`messages.ts`): `type UiKey` và `const ui: Record<UiKey, Localized>` với khoá: `title`, `description`, `skip`, `nav.about|skills|projects|experience|contact`, `menu.open`, `menu.close`, `lang.label`, `cta.contact` ("Get in touch"), `cta.cv` ("Download CV"), `kind.live|self-hosted|open-source` ("Live", "Self-hosted", "Open source"), `photo.label` ("Photo"), `presence.editing` ("is editing"), `presence.online` ("is online"), `footer.assembled` ("Assembled by"), `section.hero|about|skills|projects|experience|contact`.
- Produces (`LangProvider.tsx`): `LangProvider({ children })`; `useLang(): { lang: Lang; setLang(lang: Lang): void; t(text: Localized): string; tr(key: UiKey): string }`.

- [ ] **Step 1: Viết test thất bại.**
  - `detectLang`: `['vi-VN','en']`→`'vi'`; `['en-US','vi']`→`'en'`; `['fr','vi']`→`'vi'` (ngôn ngữ đầu tiên được hỗ trợ); `['ja','fr']`→`'en'`; `['VI']`→`'vi'`; `[]` và `undefined`→`'en'` (Review Focus #2).
  - `resolveLang`: `('vi',['en'])`→`'vi'`; `('fr',['vi'])`→`'vi'` (giá trị lưu không hỗ trợ bị bỏ qua, Review Focus #1); `(null,['en'])`→`'en'`.
  - `LangProvider`: mount với `navigator.languages = ['vi-VN']` → `document.documentElement.lang === 'vi'` và `document.title === ui.title.vi`; `setLang('en')` cập nhật cả hai và ghi `localStorage['dl:lang'] === 'en'`; `vi.spyOn(Storage.prototype, 'getItem')` ném lỗi → provider vẫn render bằng ngôn ngữ phát hiện (Review Focus #1); `t({en:'a',vi:'b'})` trả đúng theo `lang`.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/i18n`.
- [ ] **Step 3: Cài đặt** theo chữ ký ở trên. `detectLang` lấy ngôn ngữ đầu tiên (không phân biệt hoa thường) có subtag chính `vi` hoặc `en`; không có thì `en`. Provider đồng bộ `<html lang>` và `document.title` bằng `useEffect`. `title`: en "Dat Luong — Full-stack Developer", vi "Dat Luong — Lập trình viên Full-stack". Bản tiếng Việt của mọi khoá `ui` phải có giá trị thật, không để trống. `skip`: en "Skip to content", vi "Chuyển tới nội dung".
- [ ] **Step 4: Chạy test, phải PASS.**
- [ ] **Step 5: Commit.** `git add src/i18n && git commit -m "feat: add bilingual i18n with detection and persistence"`.

---

### Task 3: Nội dung hồ sơ

**Files:**
- Create: `src/content/sections.ts`, `src/content/profile.ts`
- Test: `src/content/profile.test.ts`

**Interfaces:**
- Consumes: `Localized`, `Lang` từ `src/i18n/lang.ts`.
- Produces (`sections.ts`): `const SECTION_IDS = ['hero','about','skills','projects','experience','contact'] as const`; `type SectionId`.
- Produces (`profile.ts`):
  ```ts
  type PhotoSlot = 'avatar' | 'about' | `project-${string}`
  interface PhotoAsset { src: string; width: number; height: number; alt: Localized }
  type ProjectKind = 'live' | 'self-hosted' | 'open-source'
  interface Project { slug: string; name: string; kind: ProjectKind; summary: Localized; stack: string[]; href: string }
  interface SkillGroup { id: 'frontend'|'backend'|'databases'|'devops'|'desktop-ai'; title: Localized; items: string[]; note?: Localized }
  interface ExperienceEntry { id: string; role: Localized; company: Localized; period: Localized; bullets: Localized[] }
  interface Profile {
    name: string; heroGreeting: Localized; role: Localized; pitch: Localized; availability: Localized
    about: Localized; openTo: Localized; domains: Localized[]
    quickFacts: { label: Localized; value: Localized }[]
    contact: { email: string; linkedin: string; github: string; invite: Localized }
    cvUrl?: string; photos: Partial<Record<PhotoSlot, PhotoAsset>>
  }
  const profile: Profile; const skillGroups: SkillGroup[]; const projects: Project[]; const experience: ExperienceEntry[]
  ```

- [ ] **Step 1: Viết test thất bại.**
  - Duyệt đệ quy mọi giá trị `Localized` trong `profile`, `skillGroups`, `projects`, `experience`: `en` và `vi` đều là chuỗi không rỗng.
  - `projects.map(p => p.slug)` bằng đúng `['hirezin','transtube','mealgogo','linux-clipboard','openmydear','odata2orm']`; mọi `href` bắt đầu `https://`; `href` của HireZin là `https://www.hirezin.com/`, Transtube `https://www.transtubee.com/en/`, các dự án còn lại trỏ `https://github.com/datluong2409/<slug>`; `kind` đúng bảng trong spec §5.1.
  - `skillGroups` có 5 nhóm đúng `id`; `profile.domains` có 4 mục; `profile.contact` = `{ email: 'mark.dat.code@gmail.com', linkedin: 'https://www.linkedin.com/in/dat-luong/', github: 'https://github.com/datluong2409' }`; `profile.cvUrl` là `undefined`; `profile.photos` là `{}`.
  - `profile.heroGreeting` = `{ en: "Hi, I'm Dat Luong.", vi: 'Xin chào, tôi là Dat Luong.' }`; `profile.role.en` = `'Full-stack developer — React, NestJS, and databases that stay fast.'`.
  - `experience` có 2 mục và mọi chuỗi trong đó bắt đầu bằng `TODO`; `quickFacts` (năm kinh nghiệm, địa điểm) có `value` bắt đầu bằng `TODO`.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/content`.
- [ ] **Step 3: Cài đặt** nội dung theo spec §5.1. Chỉ dùng thông tin có trong README/repo của Dat; bản tiếng Việt tự soạn, xưng "tôi". Mô tả dự án lấy từ bảng ở spec, `stack` lấy từ README (ví dụ Linux Clipboard: Tauri v2, React, TypeScript, Tailwind CSS, Rust). `skillGroups` theo spec §5.1 (nhóm `desktop-ai` gồm Tauri v2, Rust, OpenAI, Claude, Gemini).
- [ ] **Step 4: Chạy test, phải PASS.**
- [ ] **Step 5: Commit.** `git add src/content && git commit -m "feat: add typed bilingual profile content"`.

---

### Task 4: Lõi thuần của engine (agent, token, lập lịch, đường bay)

**Files:**
- Create: `src/cursors/types.ts`, `src/cursors/agents.ts`, `src/cursors/motion-tokens.ts`, `src/cursors/scheduler.ts`, `src/cursors/path.ts`
- Test: `src/cursors/motion-tokens.test.ts`, `src/cursors/scheduler.test.ts`, `src/cursors/path.test.ts`, `src/styles/contrast.test.ts`

**Interfaces:**
- Produces (`agents.ts`): `type AgentId = 'mai'|'kai'|'linh'|'alex'|'sora'|'minh'`; `interface Agent { id: AgentId; name: string; color: string }`; `const AGENTS: readonly Agent[]` (thứ tự mai, kai, linh, alex, sora, minh); `const MOBILE_BREAKPOINT = 768`; `activeAgents(viewportWidth: number): readonly Agent[]`.
- Produces (`types.ts`):
  ```ts
  type Gesture = 'draw' | 'drop'
  type ItemStatus = 'pending' | 'running' | 'done'
  interface Point { x: number; y: number }
  interface Rect { x: number; y: number; width: number; height: number }   // toạ độ overlay (tài liệu)
  interface Item { id: string; sectionId: string; el: HTMLElement; gesture: Gesture; order: number; status: ItemStatus }
  interface CursorView {
    setPosition(agentId: AgentId, x: number, y: number): void
    setVisible(agentId: AgentId, visible: boolean): void
    showGhost(agentId: AgentId, rect: Rect | null): void
    setSelection(el: HTMLElement, agent: Agent | null): void
  }
  interface GestureContext {
    item: Item; agent: Agent; view: CursorView; signal: AbortSignal
    rect: Rect; from: Point; rng: () => number
    setPosition(p: Point): void          // di chuyển con trỏ và ghi nhớ vị trí
  }
  type GestureFn = (ctx: GestureContext) => Promise<void>   // khi bị hủy thì resolve, không reject
  interface IdleContext { agent: Agent; view: CursorView; from: Point; bounds: Rect; rng: () => number; setPosition(p: Point): void }
  ```
- Produces (`motion-tokens.ts`): `MOTION` (`as const`):
  `triggerThreshold 0.35`; `travel {base 350, perPx 0.45, min 350, max 900, ease [0.22,1,0.36,1]}`; `bend {min 0.08, max 0.18}`; `draw {min 500, max 700, ease [0.16,1,0.3,1]}`; `drop {min 550, max 800, ease [0.22,1,0.36,1], offsetMin 60, offsetMax 140, startScale 0.96}`; `fadeIn 180`; `ghostOut 120`; `itemGap 120`; `agentStagger 140`; `idleFadeDelay 5000`; `idleFadeDuration 400`; `idleAmplitude {min 40, max 90}`; `eligibleMargin 100`; `gestureTimeout 4000`.
- Produces (`scheduler.ts`): `interface Box { top: number; bottom: number }` (toạ độ viewport); `isTriggered(box: Box, viewportHeight: number, threshold?: number): boolean`; `type SectionAction = 'trigger'|'skip'|'wait'`; `sectionAction(box: Box, viewportHeight: number): SectionAction`; `isEligible(box: Box, viewportHeight: number): boolean`; `nextItem<T extends { order: number; status: ItemStatus }>(items: readonly T[], eligible: (item: T) => boolean): T | undefined`; `dropOffset(order: number): Point`.
- Produces (`path.ts`): `distance(a: Point, b: Point): number`; `travelDuration(distanceInPx: number): number`; `makeBend(rng: () => number): number`; `curvePoint(from: Point, to: Point, t: number, bend: number): Point`.

- [ ] **Step 1: Viết test thất bại.**
  - `motion-tokens.test.ts`: từng giá trị của `MOTION` bằng bảng spec §6.8 (ghim giá trị).
  - `scheduler.test.ts`: `isTriggered({top:0,bottom:900},900)` true; section cao 3000px chỉ thấy 300px (`top:600`) false, thấy 400px (`top:500`) true; section thấp 300px ở đáy trang (`top:600,bottom:900`) true; section hoàn toàn dưới (`top:900`) hoặc trên (`bottom:0`) false. `sectionAction({top:-500,bottom:0},900)==='skip'`; `{top:-200,bottom:100}` → `'wait'`; `{top:0,bottom:900}` → `'trigger'`. `isEligible({top:999,bottom:1200},900)` true, `top:1000` false, `bottom:-99` true, `bottom:-100` false. `nextItem` chọn `order` nhỏ nhất trong các item `pending` và eligible, bỏ qua `running`/`done`, trả `undefined` khi không có. `dropOffset(n)`: độ dài trong [60,140], ổn định giữa các lần gọi, `dropOffset(1)` khác `dropOffset(2)`. `activeAgents(767)` là `[mai,kai,linh]`, `activeAgents(768)` có 6.
  - `path.test.ts`: `curvePoint(a,b,0,0.1)` = `a`; `t=1` = `b`; `bend=0,t=0.5` là trung điểm; `bend=0.1,t=0.5` lệch khỏi đường thẳng đúng `0.1 × khoảng cách / 2`. `travelDuration(0)===350`, `(100)===395`, `(5000)===900`. `makeBend(() => 0)` → `-0.08`; `makeBend(() => 0.99)` ≈ `0.179` (cả hai lần gọi rng: biên độ rồi dấu, dấu âm khi rng < 0.5).
  - `contrast.test.ts`: đọc `tokens.css` và `AGENTS`, tính tỷ lệ tương phản WCAG; assert ≥ 4.5 cho `fg/bg`, `fg-muted/bg`, `fg-muted/surface`, `accent/bg`, `bg/accent`, và `bg` trên màu của từng agent.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/cursors src/styles`.
- [ ] **Step 3: Cài đặt** theo chữ ký. `isTriggered`: `visible = min(box.bottom, vh) - max(box.top, 0)`; đúng khi `visible > 0` và `visible ≥ threshold × min(box.bottom - box.top, vh)`. `dropOffset`: hướng lấy từ 8 hướng quay vòng theo `order`, độ dài nội suy giữa `offsetMin` và `offsetMax` theo `order % 5`. `curvePoint`: Bézier bậc hai, điểm điều khiển = trung điểm + vector vuông góc × `bend` × khoảng cách.
- [ ] **Step 4: Chạy test, phải PASS.**
- [ ] **Step 5: Commit.** `git add src/cursors src/styles/contrast.test.ts && git commit -m "feat: add engine primitives (agents, tokens, scheduler, path)"`.

---

### Task 5: Director, phần 1: đăng ký, giao việc, chốt

**Files:**
- Create: `src/cursors/director.ts`
- Test: `src/cursors/director.test.ts`

**Interfaces:**
- Consumes: mọi thứ từ Task 4.
- Produces (`director.ts`):
  ```ts
  interface DirectorDeps {
    view: CursorView; gestures: Record<Gesture, GestureFn>
    startIdle: (ctx: IdleContext) => () => void       // trả hàm dừng
    agents: readonly Agent[]; rng: () => number
    measure: (el: HTMLElement) => Rect                // toạ độ overlay
    spawn: () => Point                                // điểm trên rìa viewport, toạ độ overlay
  }
  interface StatusEvent { agentId: AgentId; sectionId: string | null }   // null = rảnh
  interface Snapshot { sections: { id: string; el: HTMLElement; status: ItemStatus }[]; items: Item[] }
  class Director {
    constructor(deps: DirectorDeps)
    registerSection(id: string, el: HTMLElement): () => void
    registerItem(spec: { id: string; sectionId: string; el: HTMLElement; gesture: Gesture; order: number }): () => void
    setItemEligible(itemId: string, eligible: boolean): void
    triggerSection(sectionId: string): void
    completeSectionInstantly(sectionId: string): void
    getStatus(sectionId: string): ItemStatus | undefined
    snapshot(): Snapshot
    // Task 6: setReducedMotion, snapRunning, subscribe, start, dispose
  }
  ```
- Hành vi: `registerItem` đặt `data-assemble="pending"`, `data-gesture`, và `--ax`/`--ay` (px, từ `dropOffset(order)`) trên element; nếu section đã `done` thì item `done` ngay. Khi một agent nhận item: đặt `opacity: 0` và `transform: none` nội tuyến, `data-assemble="running"`, đo `measure(el)`, rồi gọi `gestures[item.gesture]`. Agent kéo việc từ hàng đợi chung qua `nextItem` (item eligible, `order` nhỏ nhất); agent thứ `i` khởi động trễ `i × agentStagger` cho item đầu của lượt chạy; giữa hai item nghỉ `itemGap`. Item `done`: `data-assemble="done"` và xóa các thuộc tính `opacity`, `transform`, `outline`, `outline-offset`, `--ax`, `--ay`.

- [ ] **Step 1: Viết test thất bại** (cử chỉ giả có thể điều khiển bằng deferred, `vi.useFakeTimers()`, `measure` trả `{x:0,y:0,width:100,height:40}`, 2 agent):
  - `registerItem` đặt đúng thuộc tính và biến `--ax`/`--ay` dạng `px`.
  - `triggerSection` chạy item theo `order` với tối đa một item mỗi agent: 3 item, 2 agent → sau stagger chỉ item 1 và 2 được gọi, item 3 bắt đầu khi một agent xong.
  - Item không eligible không được bắt đầu cho tới khi `setItemEligible(id, true)`.
  - Lúc nhận việc: `style.opacity === '0'`, `style.transform === 'none'`, `data-assemble === 'running'` **trước** khi cử chỉ được gọi.
  - Item xong: `data-assemble === 'done'` và các thuộc tính liệt kê ở trên đều rỗng; khi mọi item xong thì `getStatus(sectionId) === 'done'`.
  - Trigger section thứ hai khi section đầu đang chạy: `signal` của các cử chỉ đang chạy `aborted`, item chưa xong của section đầu thành `done` ngay, section thứ hai bắt đầu chạy.
  - Gỡ đăng ký (`unregister`) một item đang chạy: cử chỉ bị hủy, không ném lỗi, agent nhận việc kế tiếp, section vẫn hoàn tất (Review Focus #3).
  - Item có `measure` trả `width: 0` hoặc `height: 0` xong mà không gọi cử chỉ; section không có item thì `done` ngay khi trigger (Review Focus #4).
  - Cử chỉ reject lỗi: item được chốt `done` và section tiếp tục. Cử chỉ không bao giờ resolve: sau `MOTION.gestureTimeout` (4000ms) item bị chốt và `signal` bị hủy.
  - Đăng ký item vào section đã `done`: item `done` ngay, không có `pending`.
  - `completeSectionInstantly` đặt mọi item `done` mà không gọi cử chỉ; `triggerSection` trên section đang chạy hoặc đã `done` là no-op.
  - `snapshot()` liệt kê đúng section (id, el, status) và item.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/cursors/director.test.ts`.
- [ ] **Step 3: Cài đặt `Director`** theo chữ ký và hành vi ở trên. Mỗi item đang chạy có `AbortController` riêng. Sau khi `await` cử chỉ, luôn kiểm tra `signal.aborted` trước khi hoàn tất item. Chỉ một section ở trạng thái `running` tại một thời điểm. Ghi nhớ vị trí agent trong `Map<AgentId, Point>` (cập nhật qua `ctx.setPosition`); lần đầu xuất hiện, đặt vị trí bằng `spawn()` rồi `view.setVisible(id, true)`.
- [ ] **Step 4: Chạy test, phải PASS.**
- [ ] **Step 5: Commit.** `git add src/cursors/director.ts src/cursors/director.test.ts && git commit -m "feat: add Director scheduling and snapping"`.

---

### Task 6: Director, phần 2: reduced-motion, rảnh, sự kiện, dọn dẹp

**Files:**
- Modify: `src/cursors/director.ts`, `src/cursors/director.test.ts`

**Interfaces:**
- Consumes: `Director` từ Task 5.
- Produces: `setReducedMotion(on: boolean): void`; `snapRunning(): void`; `subscribe(listener: (e: StatusEvent) => void): () => void`; `start(): void`; `dispose(): void`.
- Hành vi: `setReducedMotion(true)` hủy cử chỉ đang chạy, đặt mọi item của mọi section `done`, ẩn mọi agent (`setVisible(id,false)`), dừng idle và hẹn giờ; `triggerSection` thành no-op và item đăng ký sau đó `done` ngay. `snapRunning()` chỉ chốt section đang chạy. Khi section `done` và không còn section chạy: mỗi agent gọi `startIdle` với `bounds = measure(sectionEl)`; sau `idleFadeDelay` (5000ms) không có trigger mới thì gọi hàm dừng idle và `setVisible(id,false)` cho mọi agent. Trigger mới huỷ hẹn giờ và dừng idle; agent đã ẩn xuất hiện lại bằng `setPosition(spawn())` rồi `setVisible(true)`. `subscribe` nhận `{ agentId, sectionId }` khi agent nhận item và `{ agentId, sectionId: null }` khi rảnh. `dispose()` chốt section đang chạy, hủy cử chỉ, xóa mọi timer; `start()` bỏ cờ đã dispose để dùng lại (bắt buộc cho React StrictMode); đăng ký được giữ nguyên.

- [ ] **Step 1: Viết test thất bại** (bổ sung vào `director.test.ts`):
  - `setReducedMotion(true)` khi đang chạy: `signal` bị hủy, mọi item `done`, `setVisible(id,false)` gọi cho từng agent; sau đó `triggerSection` không gọi cử chỉ, và item đăng ký mới không có `data-assemble="pending"`.
  - Idle: khi item cuối xong `startIdle` gọi một lần cho mỗi agent với `bounds` bằng `measure` của section; sau 5000ms (`advanceTimersByTime`) mọi agent `setVisible(id,false)` và hàm dừng idle đã gọi; trigger trong khoảng 5000ms hủy fade-out và dừng idle.
  - Xuất hiện lại: trigger sau khi đã ẩn gọi `setPosition(id, spawnPoint)` rồi `setVisible(id,true)` trước cử chỉ đầu tiên.
  - `subscribe`: nhận đúng sự kiện nhận việc và rảnh; hàm trả về hủy đăng ký.
  - `snapRunning()` chốt section đang chạy nhưng không đụng section `pending`.
  - `dispose()`: cử chỉ bị hủy, `vi.getTimerCount() === 0`; sau `start()` thì `triggerSection` chạy lại bình thường.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/cursors/director.test.ts`.
- [ ] **Step 3: Cài đặt** các phương thức và hành vi ở trên.
- [ ] **Step 4: Chạy test, phải PASS** (kể cả các test của Task 5).
- [ ] **Step 5: Commit.** `git add src/cursors && git commit -m "feat: Director reduced-motion, idle fade-out, status events, lifecycle"`.

---

### Task 7: Cử chỉ, chuyển động rảnh, lớp hiển thị con trỏ

**Files:**
- Create: `src/cursors/animate.ts`, `src/cursors/gestures/travel.ts`, `src/cursors/gestures/draw.ts`, `src/cursors/gestures/drop.ts`, `src/cursors/idle.ts`, `src/cursors/cursor-view.ts`
- Test: `src/cursors/gestures/draw.test.ts`, `src/cursors/gestures/drop.test.ts`, `src/cursors/idle.test.ts`, `src/cursors/cursor-view.test.ts`

**Interfaces:**
- Consumes: `GestureContext`, `GestureFn`, `IdleContext`, `CursorView`, `Rect`, `Point`, `MOTION`, `travelDuration`, `makeBend`, `curvePoint`, `distance`, `AGENTS`.
- Produces:
  ```ts
  // animate.ts
  interface TweenOptions { duration: number /* ms */; ease: readonly [number, number, number, number]; onUpdate(progress: number): void; signal: AbortSignal }
  type Tween = (opts: TweenOptions) => Promise<void>      // bị hủy thì resolve
  const motionTween: Tween                                 // dùng animate(0, 1, …) của "motion"
  // gestures
  travel(ctx: GestureContext, tween: Tween, to: Point): Promise<void>
  createDrawGesture(tween: Tween): GestureFn
  createDropGesture(tween: Tween): GestureFn
  // idle.ts
  idleOffset(t: number, phase: number, amplitude: number): Point   // |x|,|y| ≤ amplitude, xác định
  startIdle(ctx: IdleContext): () => void
  // cursor-view.ts
  createCursorView(root: HTMLElement, agents: readonly Agent[]): CursorView & { destroy(): void }
  ```

- [ ] **Step 1: Viết test thất bại** (dùng `tween` giả đồng bộ: gọi `onUpdate(0)` rồi `onUpdate(1)`, ghi lại `duration`):
  - `draw`: con trỏ đi qua góc trên-trái của `rect` rồi kết thúc ở góc dưới-phải (`setPosition` cuối bằng `{x: rect.x+rect.width, y: rect.y+rect.height}`); `showGhost` có chiều rộng không giảm, lần cuối khác null bằng đúng `rect`, và lời gọi cuối cùng là `showGhost(id, null)`; `el.style.opacity === '1'` khi xong; thời lượng `draw` trong [500,700]; thời lượng bay bằng `travelDuration(distance(from, rect góc))`; hủy trước khi bắt đầu: resolve, `showGhost(id, null)` được gọi.
  - `drop`: lúc bắt đầu `el.style.transform` là `translate3d(<ax>px, <ay>px, 0) scale(0.96)` (đọc `--ax`/`--ay` đã đặt sẵn trên element); lúc kết thúc đúng `translate3d(0px, 0px, 0) scale(1)`; nhặt item thì `opacity` thành `'1'` và `setSelection(el, agent)`, thả thì `setSelection(el, null)`; vị trí con trỏ lúc cuối bằng `rect` góc trên-trái cộng điểm cầm `{x: min(12, width/2), y: min(12, height/2)}`; hủy giữa chừng vẫn gọi `setSelection(el, null)`.
  - `idleOffset`: bị chặn trong biên độ và xác định theo `t`, `phase`.
  - `cursor-view`: `setPosition` đặt `style.transform` bằng `translate3d(10px, 20px, 0)`; `setVisible(id,false)` đặt `data-visible="false"`; `showGhost` đặt `left/top/width/height` và hiện, `null` ẩn; `setSelection(el, agent)` đặt `outline` không rỗng, `setSelection(el, null)` xóa về chuỗi rỗng; `destroy()` gỡ DOM.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/cursors`.
- [ ] **Step 3: Cài đặt.**
  - `motionTween`: `animate(0, 1, { duration: duration / 1000, ease, onUpdate })`; hủy bằng `controls.stop()` và resolve.
  - `travel`: nội suy `curvePoint(ctx.from, to, p, makeBend(ctx.rng))` theo `p`, thời lượng `travelDuration`, easing `MOTION.travel.ease`, gọi `ctx.setPosition`.
  - `draw`: travel → góc trên-trái; tween `draw` (thời lượng nội suy giữa `min` và `max` theo diện tích khung) mở rộng ghost và kéo con trỏ theo góc dưới-phải; tween `fadeIn` cho `opacity` của item; `finally` luôn `showGhost(id, null)`.
  - `drop`: travel → vị trí khay (`rect` cộng offset, cộng điểm cầm); tween `drop` đưa `transform` và vị trí con trỏ về đích bằng cùng một giá trị tiến trình; `finally` luôn `setSelection(el, null)`.
  - `startIdle`: vòng `requestAnimationFrame` dùng `idleOffset` quanh một điểm trong `bounds`, biên độ lấy ngẫu nhiên trong `MOTION.idleAmplitude`; trả hàm dừng.
  - `createCursorView`: mỗi agent có `div.cursor[data-agent]` (mũi tên SVG tô màu agent, pill tên chữ `--color-bg` nền màu agent, font mono) và `div.ghost[data-agent]` (viền 1.5px màu agent, 4 tay nắm góc); `setSelection` đặt `outline: 1.5px solid <màu>; outline-offset: 2px`. Không có file CSS: style bằng class Tailwind gán qua `className` trong `cursor-view.ts` (ví dụ cursor `absolute top-0 left-0 opacity-0 transition-opacity duration-200 will-change-transform data-[visible=false]:duration-[400ms]`, ghost `transition-opacity duration-[120ms]`), toạ độ và kích thước đặt bằng `style` nội tuyến.
- [ ] **Step 4: Chạy test, phải PASS.**
- [ ] **Step 5: Commit.** `git add src/cursors && git commit -m "feat: add draw/drop gestures, idle drift, and cursor view"`.

---

### Task 8: Lớp keo React (Provider, Section, hook, quan sát viewport)

**Files:**
- Create: `src/cursors/context.ts`, `src/cursors/observers.ts`, `src/cursors/AssemblyProvider.tsx`, `src/cursors/Section.tsx`, `src/cursors/useAssemble.ts`, `src/cursors/usePresence.ts`
- (không sửa file CSS: luật ẩn-pending là class Tailwind trên wrapper của `AssemblyProvider`)
- Test: `src/cursors/observers.test.ts`, `src/cursors/useAssemble.test.tsx`

**Interfaces:**
- Consumes: `Director`, `createCursorView`, `createDrawGesture`, `createDropGesture`, `motionTween`, `startIdle`, `activeAgents`, `sectionAction`, `isEligible`, `SectionId`.
- Produces:
  ```ts
  // context.ts
  interface AssemblyValue { director: Director; agents: readonly Agent[] }
  const AssemblyContext: React.Context<AssemblyValue | null>
  const SectionContext: React.Context<SectionId | null>
  function useAssembly(): AssemblyValue | null
  // observers.ts
  type ObservedDirector = Pick<Director, 'snapshot' | 'setItemEligible' | 'triggerSection' | 'completeSectionInstantly'>
  evaluateViewport(director: ObservedDirector, viewportHeight: number): void
  attachViewportObservers(director: ObservedDirector, root: HTMLElement): () => void
  // components
  AssemblyProvider({ children }): JSX.Element
  Section({ id, className, children }: { id: SectionId; className?: string; children: React.ReactNode }): JSX.Element
  useAssemble<T extends HTMLElement = HTMLElement>(opts: { gesture: Gesture; order: number }): React.RefObject<T | null>
  usePresence(): Partial<Record<AgentId, SectionId | null>>
  ```

- [ ] **Step 1: Viết test thất bại.**
  - `observers.test.ts` (director giả, `getBoundingClientRect` giả): section `pending` nằm hoàn toàn phía trên viewport → `completeSectionInstantly`; hai section cùng đủ điều kiện kích hoạt → section trước `completeSectionInstantly`, section sau `triggerSection`; section chưa đủ ngưỡng → không gọi gì; `setItemEligible` cho mọi item chưa `done` được gọi **trước** `triggerSection`.
  - `useAssemble.test.tsx` (stub `matchMedia`): trong `AssemblyProvider` + `Section`, sau mount element có `data-assemble="pending"`, `data-gesture`, và `--ax`/`--ay`; ngoài provider thì không có `data-assemble`; với `matchMedia('(prefers-reduced-motion: reduce)')` khớp thì không còn `data-assemble="pending"` và item `done`; sau khi section `done`, React re-render không đưa `data-assemble` về `pending`; unmount thì `director.snapshot().items` rỗng (dùng component thăm dò gọi `useAssembly()`).
  - `usePresence` với `AssemblyContext.Provider` giả: sự kiện `{agentId:'mai', sectionId:'projects'}` cập nhật giá trị trả về.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/cursors`.
- [ ] **Step 3: Cài đặt.**
  - `evaluateViewport`: (1) với mọi item chưa `done`, `setItemEligible(id, isEligible(rect, vh))`; (2) với section `pending`: `sectionAction` là `'skip'` → `completeSectionInstantly`, gom các section `'trigger'`; (3) mọi section trigger trừ cái cuối → `completeSectionInstantly`, cái cuối → `triggerSection`.
  - `attachViewportObservers`: lắng nghe `scroll` (passive) và `resize` của `window`, gộp bằng `requestAnimationFrame`, cộng `ResizeObserver` trên `root` (đổi layout do font/ngôn ngữ); trả hàm gỡ.
  - `AssemblyProvider`: tạo `Director` bằng `useState(() => …)` với `view` chuyển tiếp trễ (no-op tới khi overlay mount), `agents = activeAgents(window.innerWidth)`, `gestures` từ `createDrawGesture/createDropGesture(motionTween)`, `startIdle`, `rng: Math.random`, `measure` quy về toạ độ wrapper, `spawn` chọn ngẫu nhiên một điểm trên rìa viewport. Render wrapper `position: relative; overflow-x: clip` chứa `children` và overlay (`aria-hidden`, class theo Global Constraints) rồi tạo `createCursorView` trong `useEffect`. Trong effect: `director.start()`; `director.setReducedMotion(mq.matches)` + lắng nghe `change`; `visibilitychange` sang `visible` thì `director.snapRunning()`; `attachViewportObservers`; chạy `evaluateViewport` lần đầu sau `document.fonts?.ready`; cleanup gọi `director.dispose()` (idempotent, an toàn với StrictMode).
  - `Section`: `<section id>` đăng ký với `director.registerSection` trong `useLayoutEffect`, cung cấp `SectionContext`.
  - `useAssemble`: `useId()` làm id item; `useLayoutEffect` gọi `director.registerItem` với section gần nhất và trả hàm gỡ; không render `data-assemble` trong JSX. Không có provider hoặc không có section thì không làm gì.
  - Ẩn-pending bằng class Tailwind trên wrapper của provider: `motion-safe:[&_[data-assemble=pending]]:opacity-0` và `motion-safe:[&_[data-assemble=pending][data-gesture=drop]]:[transform:translate3d(var(--ax),var(--ay),0)_scale(0.96)]`. Không cần lớp `js` vì thuộc tính `data-assemble` chỉ tồn tại khi JS đã chạy. Stagger chip nằm ở `Chip` (Task 9).
- [ ] **Step 4: Chạy test, phải PASS.**
- [ ] **Step 5: Commit.** `git add src/cursors src/styles && git commit -m "feat: add React assembly provider, section, and useAssemble hook"`.

---

### Task 9: Component dùng chung và điều hướng

**Files:**
- Create: `src/components/Photo.tsx`, `Card.tsx`, `Chip.tsx`, `SectionHeading.tsx`, `LangToggle.tsx`, `PresenceBar.tsx`, `Nav.tsx`
- Test: `Photo.test.tsx`, `LangToggle.test.tsx`, `PresenceBar.test.tsx`, `Nav.test.tsx` (cùng thư mục)

**Interfaces:**
- Consumes: `useLang`, `ui`, `profile`, `PhotoSlot`, `useAssemble`, `usePresence`, `AGENTS`, `SECTION_IDS`.
- Produces:
  ```ts
  Photo({ slot, aspect, eager, className }: { slot: PhotoSlot; aspect: string; eager?: boolean; className?: string })
  Card({ className, children })  Chip({ children, index? })  // index đặt --i cho stagger
  SectionHeading({ id, eyebrow, title, order }: { id: string; eyebrow: Localized; title: Localized; order: number })  // h2, item gesture 'drop'
  LangToggle()  PresenceBar()  Nav()
  ```

- [ ] **Step 1: Viết test thất bại.**
  - `Photo`: không có asset → khung `aspect-ratio` nét đứt có nhãn `ui['photo.label']` và tên slot; có asset (mock `../content/profile`) → `<img>` có `width`, `height`, `alt` đúng ngôn ngữ, `loading="lazy"` (trừ `eager`); ảnh `error` → quay lại khung placeholder, cùng `aspect-ratio`, không còn `<img>` (Review Focus #5).
  - `LangToggle`: hai nút EN/VI, nút đang chọn có `aria-pressed="true"`; bấm VI đổi `useLang().lang`.
  - `PresenceBar`: bọc bằng `aria-hidden="true"`, 6 avatar (chữ cái đầu); với `AssemblyContext.Provider` giả phát sự kiện `{agentId:'mai', sectionId:'projects'}` thì tooltip có văn bản "Mai is editing Projects" (EN) và khi rảnh "Mai is online".
  - `Nav`: 5 link `#about`, `#skills`, `#projects`, `#experience`, `#contact`, nút Contact (`#contact`), `LangToggle`, `PresenceBar`; nút menu có `aria-expanded` và `aria-controls`; mở menu rồi nhấn `Esc` thì đóng và focus quay về nút menu; bấm một link trong menu thì menu đóng.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/components`.
- [ ] **Step 3: Cài đặt.** Nav `position: fixed`, cao 64px, `z-index: 40`, không tham gia lắp ráp (fade-in bằng CSS khi tải); nút bấm cao ≥ 44px trên mobile; panel menu `z-index: 60`; icon Phosphor có `aria-hidden` kèm nhãn văn bản hoặc `aria-label`. Placeholder `Photo` dùng class `border border-dashed border-border bg-surface`. `Card` có class `group`; `Chip` dùng `motion-safe:group-data-[assemble=done]:animate-chip-in [animation-delay:calc(var(--i,0)*40ms)]`, với `--animate-chip-in: chip-in 220ms both` và `@keyframes chip-in` (opacity 0→1, translateY 4px→0) khai báo trong khối `@theme` của `tokens.css`. Tooltip PresenceBar luôn có trong DOM, hiện bằng CSS khi hover.
- [ ] **Step 4: Chạy test, phải PASS.**
- [ ] **Step 5: Commit.** `git add src/components && git commit -m "feat: add shared components, nav, language toggle, presence bar"`.

---

### Task 10: Section Hero, About, Contact và Footer

**Files:**
- Create: `src/sections/Hero.tsx`, `About.tsx`, `Contact.tsx`, `src/components/Footer.tsx`
- Test: `src/sections/Hero.test.tsx`, `About.test.tsx`, `Contact.test.tsx`

**Interfaces:**
- Consumes: `Section`, `useAssemble`, `SectionHeading`, `Photo`, `Chip`, `Card`, `profile`, `useLang`.
- Produces: `Hero()`, `About()`, `Contact()`, `Footer()`. Item của từng section (gesture, order):
  - Hero: avatar `Photo` (draw 1), chip "Open to work" (drop 2), `h1` (drop 3), dòng vai trò (drop 4), đoạn giới thiệu (drop 5), nhóm CTA (draw 6).
  - About: tiêu đề (drop 1), đoạn bio (drop 2), dải domain (drop 3), `Photo` (draw 4), thẻ thông tin nhanh (draw 5).
  - Contact: tiêu đề (drop 1), lời mời (drop 2), nhóm ba link (draw 3).

- [ ] **Step 1: Viết test thất bại.** Bọc trong `LangProvider`.
  - Hero: `h1` bằng `profile.heroGreeting` ở EN và VI; có dòng vai trò; nút "Get in touch" trỏ `#contact`; "Download CV" **không** xuất hiện khi `profile.cvUrl` là `undefined`, xuất hiện với đúng `href` khi mock có `cvUrl`; có khung `Photo` slot `avatar`.
  - About: đủ 4 domain; câu `openTo`; hai mục quick facts.
  - Contact: ba link `mailto:mark.dat.code@gmail.com`, `https://www.linkedin.com/in/dat-luong/`, `https://github.com/datluong2409` (không `target="_blank"`); không có `<form>`. Footer: văn bản chứa "Assembled by Mai, Kai, Linh, Alex, Sora and Minh" ở EN.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/sections`.
- [ ] **Step 3: Cài đặt.** Hero `min-height: 100dvh`, tiêu đề dùng `clamp(2.5rem, 6vw, 4.5rem)`; CTA chính là nút nền `accent` chữ `bg`, CTA phụ là nút viền; mỗi section chỉ một nút chính. Mọi nội dung lấy từ `profile` và `ui` qua `t`/`tr`.
- [ ] **Step 4: Chạy test, phải PASS.**
- [ ] **Step 5: Commit.** `git add src/sections src/components/Footer.tsx && git commit -m "feat: add hero, about, contact sections and footer"`.

---

### Task 11: Section Skills, Projects, Experience

**Files:**
- Create: `src/sections/Skills.tsx`, `Projects.tsx`, `Experience.tsx`
- Test: `src/sections/Skills.test.tsx`, `Projects.test.tsx`, `Experience.test.tsx`

**Interfaces:**
- Consumes: như Task 10, cộng `skillGroups`, `projects`, `experience`.
- Produces: `Skills()`, `Projects()`, `Experience()`. Item:
  - Skills: tiêu đề (drop 1), năm card nhóm (draw 2–6); chip trong card dùng `Chip index` (stagger CSS, không phải item).
  - Projects: tiêu đề (drop 1), sáu card dự án (draw 2–7), mỗi card có `Photo` slot `project-<slug>`, huy hiệu loại (`ui['kind.*']`), tag công nghệ, một link bao phủ card.
  - Experience: tiêu đề (drop 1), hai mục timeline (draw 2–3) trong `<ol>`.

- [ ] **Step 1: Viết test thất bại.**
  - Skills: 5 card; mỗi card liệt kê đúng `items` của nhóm; chip có `--i`.
  - Projects: 6 card; `getByRole('link', { name: /HireZin/ })` có `href` bằng `projects[0].href`; không link nào có `target="_blank"`; huy hiệu hiển thị đúng chữ `kind` theo ngôn ngữ; mỗi card có khung `Photo` đúng slot; VI hiển thị `summary.vi`.
  - Experience: 2 mục trong `<ol>`; nội dung `TODO` hiển thị nguyên văn.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/sections`.
- [ ] **Step 3: Cài đặt.** Projects dùng lưới `grid` 1 cột (mobile) / 2 cột (tablet) / 3 cột (desktop); mỗi `Card` cấp `h3` chứa link; chip và tag cỡ chữ ≥ 12px, font mono.
- [ ] **Step 4: Chạy test, phải PASS.**
- [ ] **Step 5: Commit.** `git add src/sections && git commit -m "feat: add skills, projects, experience sections"`.

---

### Task 12: Ghép trang, SEO tĩnh, cấu hình Cloudflare

**Files:**
- Modify: `src/App.tsx`, `src/App.test.tsx`, `src/main.tsx`, `index.html`
- Create: `public/_headers`, `public/robots.txt`, `public/favicon.svg`, `public/og.png`
- Test: `src/App.test.tsx`, `src/index-html.test.ts`

**Interfaces:**
- Consumes: mọi section, `Nav`, `Footer`, `LangProvider`, `AssemblyProvider`, `SECTION_IDS`.
- Produces: `App()` ghép: `LangProvider > AssemblyProvider > [skip-link, Nav, main#content > Hero…Contact, Footer]`.

- [ ] **Step 1: Viết test thất bại.**
  - `App.test.tsx`: sáu `section` có `id` đúng thứ tự `SECTION_IDS`; đúng một `h1`; thứ tự heading trong tài liệu không bao giờ nhảy cấp quá 1; mỗi section có ≤ 10 phần tử `[data-assemble]`; link "Skip to content" trỏ tới `main#content` tồn tại; với `matchMedia` reduced-motion khớp thì không có `[data-assemble="pending"]` nào.
  - `index-html.test.ts` (đọc `index.html` bằng `fs`): có `lang="en"`; có `<meta name="description">`, `og:title`, `og:description`, `og:image`; khối `<script type="application/ld+json">` parse được thành JSON có `@type: 'Person'`, `name: 'Dat Luong'`, `sameAs` gồm GitHub và LinkedIn; có `<noscript>` chứa tên, vai trò, email, LinkedIn, GitHub.
- [ ] **Step 2: Chạy test, phải FAIL.** `npx vitest run src/App.test.tsx src/index-html.test.ts`.
- [ ] **Step 3: Cài đặt.** `index.html`: title/description/OG tiếng Anh (hạn chế đã chấp nhận), JSON-LD `Person`, `<noscript>` tĩnh. `public/_headers`: `/assets/*` `Cache-Control: public, max-age=31536000, immutable`; `/*` `X-Content-Type-Options: nosniff` và `Referrer-Policy: strict-origin-when-cross-origin`. `robots.txt` cho phép tất cả. `favicon.svg` đơn giản (con trỏ xanh trên nền `bg`). `og.png`: sinh một PNG 1200×630 màu đặc `#0A0D12` bằng script Python một lần (stdlib `zlib` + `struct`), không commit script; chủ dự án sẽ thay.
- [ ] **Step 4: Chạy toàn bộ test và build.** `npm test` → PASS; `npm run build` → thành công.
- [ ] **Step 5: Commit.** `git add src public index.html && git commit -m "feat: compose page with SEO metadata and Cloudflare config"`.

---

### Task 13: Kiểm tra trên trình duyệt, ngân sách, tài liệu

**Files:**
- Create: `scripts/check-bundle.mjs`, `README.md`, `.claude/launch.json`
- Modify: (sửa lỗi phát hiện được ở bất kỳ file nào kèm test hồi quy)

**Interfaces:**
- Consumes: toàn bộ ứng dụng đã build.
- Produces: script `check:bundle` thất bại (exit 1) nếu tổng JS gzip của `dist/assets/*.js` > 150 KB và in kích thước; README có mục "Chỉnh nội dung", "Thêm ảnh", "Deploy Cloudflare Pages".

- [ ] **Step 1: Ngân sách bundle.** Viết `scripts/check-bundle.mjs` (đọc `dist/assets/*.js`, `zlib.gzipSync`, in tổng, `process.exit(1)` nếu > 150×1024). Chạy `npm run build && npm run check:bundle`. Expected: in tổng kích thước và exit 0.
- [ ] **Step 2: README.** Ghi: chỉnh nội dung ở `src/content/profile.ts` (mọi `TODO` cần thay), thêm ảnh bằng cách thả file vào `public/images/` rồi điền `photos[slot]`, `cvUrl`, đổi OG image; Cloudflare Pages: build command `npm run build`, output `dist`; ghi chú về font tiếng Việt nếu Task 1 phát hiện thiếu.
- [ ] **Step 3: Khởi chạy dev server.** Tạo `.claude/launch.json` với cấu hình `dev` (`npm`, `["run","dev","--","--port","5173"]`, port 5173), `preview_start` tên `dev`.
- [ ] **Step 4: Kiểm tra theo spec §10 (mỗi mục ghi kết quả thật, không suy đoán):**
  1. Noscript: `curl http://localhost:5173/` chứa `<noscript>` với tên, vai trò, email, LinkedIn, GitHub.
  2. 1440×900: cuộn từ đầu tới cuối; mỗi section chạy đúng một lần, ≤ khoảng 4 giây, tên và màu con trỏ đúng, console không lỗi (`read_console_messages`), chụp ảnh màn hình một khoảnh khắc từng section.
  3. Nhảy tới `#contact` và cuộn nhanh liên tục; sau khi dừng cuộn ~300ms, `document.querySelectorAll('[data-assemble="pending"],[data-assemble="running"]').length` phải bằng 0 trong các section đã đi qua.
  4. Reduced-motion: nếu công cụ trình duyệt không giả lập được `prefers-reduced-motion`, ghi rõ là chưa kiểm trong trình duyệt và dựa vào test Task 6/8; không được khẳng định đã kiểm.
  5. Đổi EN ↔ VI: không chạy lại hiệu ứng, `document.documentElement.lang` đổi, không tràn ngang (`document.documentElement.scrollWidth <= window.innerWidth`), đọc kỹ chuỗi tiếng Việt xem có dấu bị cắt hay vỡ chữ.
  6. 375, 768, 1024, 1440px (`resize_window`): không cuộn ngang; ở 375px chỉ có 3 con trỏ; menu mobile mở/đóng bằng bàn phím; vùng bấm ≥ 44px.
  7. Tương phản, focus nhìn thấy khi Tab qua toàn bộ link, CLS (đo bằng `PerformanceObserver` `layout-shift` trong trang, mục tiêu < 0.1), và chạy Lighthouse mobile nếu `npx lighthouse` chạy được (mục tiêu Performance ≥ 90, Accessibility ≥ 95); nếu không chạy được, ghi là chưa đo.
- [ ] **Step 5: Sửa lỗi.** Mỗi lỗi phát hiện: viết test hồi quy thất bại trước (khi lỗi nằm ở logic), sửa, chạy lại. Lỗi chỉ về hình ảnh thì sửa và chụp lại ảnh để xác nhận.
- [ ] **Step 6: Chạy `npm run verify`.** Expected: typecheck, test, build, check-bundle đều qua.
- [ ] **Step 7: Dừng dev server** (`preview_stop`), rồi commit: `git add scripts README.md src && git commit -m "chore: verify in browser, add bundle check and README"`. Không commit `.claude/launch.json`.
