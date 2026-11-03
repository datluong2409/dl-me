# Dat Luong Portfolio — Design Spec

Ngày: 2026-11-03 · Trạng thái: chờ chủ dự án duyệt · Phạm vi: dự án mới, thư mục gốc `D:\p\dl-me`

## 1. Mục tiêu và hiểu biết chung

**Mục tiêu.** Một landing page cá nhân để Dat Luong (Full-stack Developer) xin việc: trông chuyên nghiệp, đọc nhanh với recruiter, và có một điểm nhấn khó quên là hiệu ứng "multi-agent render". Nhiều con trỏ nhiều màu, có tên người, cùng nhau lắp ráp từng element của section đang được xem, như nhiều người cùng chỉnh một file Figma.

**Tiêu chí thành công.**
1. Recruiter nắm được trong 10 giây: Dat là ai, làm được gì, sản phẩm nào đã live, liên hệ ở đâu.
2. Hiệu ứng lắp ráp mượt, không chặn việc đọc và không làm hỏng nội dung ở bất kỳ tình huống nào (cuộn nhanh, đổi ngôn ngữ, reduced-motion, tắt JS).
3. Song ngữ EN/VI, tự chọn theo người truy cập.
4. Deploy tĩnh lên Cloudflare Pages, chủ dự án tự thêm ảnh và thông tin còn thiếu ở một chỗ duy nhất.

**Không làm (out of scope).** CMS, blog, trang case study riêng, form liên hệ/backend, analytics, SSR/prerender, giao diện sáng (chỉ có một theme tối), con trỏ "You" của người xem, chọn ngôn ngữ theo IP, chạy lại hiệu ứng khi cuộn ngược.

## 2. Quyết định đã chốt với chủ dự án

| Chủ đề | Quyết định |
|---|---|
| Ngôn ngữ | Song ngữ EN + VI; tự nhận diện theo người truy cập; có nút chuyển tay |
| Tên con trỏ | Tên người kiểu Figma (Mai, Kai, Linh, Alex, Sora, Minh) |
| Cấu trúc | Một trang cuộn dọc, nav neo |
| Công nghệ | Vite + React + TypeScript + Tailwind + Motion |
| Deploy | Cloudflare Pages |
| Ảnh | Để khung trống có nhãn ở các chỗ cần ảnh, thêm sau |
| Hướng engine | Điều phối theo DOM thật (không dùng timeline tọa độ cứng, không canvas/WebGL) |

## 3. Giả định do thiết kế đặt ra (chủ dự án có thể sửa)

- Nội dung chỉ lấy từ GitHub profile và README công khai. Thông tin không có trong đó (năm kinh nghiệm, công ty, chức danh, địa điểm, CV, bio dài) là placeholder gắn nhãn `TODO`, không bịa.
- Tiếng Việt xưng "tôi" cho trang xin việc (trang trọng, an toàn). Có thể đổi sang "mình".
- Ngưỡng kích hoạt section là "đã thấy ≥ 35% của phần tối đa có thể thấy" (xem 6.3), không phải "35% chiều cao section" như bản trình bày miệng, vì section cao hơn viewport sẽ không bao giờ đạt.
- Nav và presence bar là phần tử `position: fixed`, nên không tham gia lắp ráp; chúng chỉ fade-in khi tải trang.
- Chỉ một theme tối, `color-scheme: dark`.
- Có JSON-LD `Person` (tên, GitHub, LinkedIn) để chia sẻ link và công cụ tìm kiếm hiểu trang.

## 4. Thiết kế hình ảnh

### 4.1 Token màu

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--bg` | `#0A0D12` | nền trang |
| `--surface` | `#11161D` | card, khung ảnh |
| `--border` | `#232C3A` | viền 1px |
| `--fg` | `#F1F5F9` | chữ chính |
| `--fg-muted` | `#94A3B8` | chữ phụ |
| `--accent` | `#22C55E` | CTA, link, chấm "Open to work" (chữ trên accent dùng `--bg`) |
| `--ring` | `#F1F5F9` | focus ring 2px, offset 2px |

Màu accent của UI chỉ có một (xanh lá) để các màu con trỏ là thứ nổi bật nhất trên trang. Mọi cặp chữ/nền phải đạt tỷ lệ tương phản ≥ 4.5:1 (kiểm tra ở bước verify).

### 4.2 Đội con trỏ

| Id | Tên | Màu |
|---|---|---|
| `mai` | Mai | `#FF6B6B` |
| `kai` | Kai | `#38BDF8` |
| `linh` | Linh | `#A78BFA` |
| `alex` | Alex | `#FBBF24` |
| `sora` | Sora | `#F472B6` |
| `minh` | Minh | `#2DD4BF` |

Con trỏ gồm mũi tên SVG và pill tên (chữ `--bg` đậm trên nền màu, tương phản ≥ 4.5:1). Viewport rộng < 768px chỉ dùng 3 con đầu (Mai, Kai, Linh).

### 4.3 Chữ, icon, khoảng cách

- Font: IBM Plex Sans (nội dung, tiêu đề), JetBrains Mono (nhãn, chip, tên con trỏ). Self-host bằng `@fontsource`, subset `latin`, `latin-ext`, `vietnamese`, `font-display: swap`. Phải xác nhận subset tiếng Việt có trong cả hai gói khi cài; nếu thiếu, thay font dự phòng và ghi lại.
- Thang cỡ chữ: 12 / 14 / 16 / 18 / 24 / 32 / 48 và hero `clamp(2.5rem, 6vw, 4.5rem)`. Body 16px, line-height 1.6, độ dài dòng 60–75 ký tự.
- Icon: Phosphor (`@phosphor-icons/react`), một bộ, một độ dày nét. Không dùng emoji làm icon.
- Khoảng cách theo bội số của 4/8; container tối đa 1120px; padding ngang 16px (mobile) / 24px (tablet) / 32px (desktop); bán kính 12px (card), 999px (chip, pill).
- Không dùng đổ bóng; phân tầng bằng viền và màu nền.

## 5. Cấu trúc trang và nội dung

Thứ tự: **Hero, About, Skills, Projects, Experience, Contact**. Nav cố định phía trên: tên, link neo tới 5 section, nút EN | VI, nút Contact; presence bar nằm bên cạnh. Trên mobile, nav gọn lại gồm tên, EN | VI và nút menu (≥ 44px); menu mở một panel danh sách link, `Esc` đóng và trả focus về nút menu. Có skip-link "Skip to content" ở đầu trang. Chỉ một `<h1>` (trong Hero).

### 5.1 Nội dung từng section

**Hero.** Chấm trạng thái "Open to work"; `h1` "Hi, I'm Dat Luong."; dòng vai trò "Full-stack developer — React, NestJS, and databases that stay fast."; đoạn giới thiệu 2 câu (web app an toàn, mở rộng được, CI/CD; gần đây làm sản phẩm AI cho tuyển dụng và học từ video); hai CTA "Get in touch" (cuộn tới Contact) và "Download CV" (chỉ hiện khi `profile.cvUrl` có giá trị); khung ảnh chân dung (placeholder).

**About.** Đoạn giới thiệu; dải 4 domain đã làm (Healthcare, Real Estate, Food Ordering & Billing, HR & Recruitment); câu "Open to freelance, startup, and on-site roles"; khung ảnh thứ hai (placeholder); thông tin nhanh (năm kinh nghiệm, địa điểm: placeholder `TODO`).

**Skills.** Năm nhóm, mỗi nhóm là một card chứa chip:
- Frontend: React, TypeScript, JavaScript, Tailwind CSS
- Backend: Node.js, NestJS, REST APIs
- Databases: SQL Server, PostgreSQL (indexing, query tuning, schema design)
- DevOps: GitHub Actions, Cloudflare
- Desktop và AI: Tauri v2, Rust, tích hợp OpenAI / Claude / Gemini

**Projects.** Sáu card (khung ảnh chụp màn hình là placeholder, huy hiệu loại, tag công nghệ, link):

| Dự án | Loại | Mô tả ngắn (nguồn: README/repo) | Link |
|---|---|---|---|
| HireZin | Live | ATS dùng AI để sàng lọc và xếp hạng ứng viên | https://www.hirezin.com/ |
| Transtube | Live | Tiện ích trình duyệt biến video YouTube thành tóm tắt, transcript, chat; hỗ trợ OpenAI, Claude, Gemini, model cục bộ | https://www.transtubee.com/en/ |
| MealGoGo | Self-hosted | Hệ thống đặt đồ ăn cho nhóm, không cần cài app, gom đơn và chia tiền minh bạch | https://github.com/datluong2409/mealgogo |
| Linux Clipboard | Open source | Lịch sử clipboard kiểu Win+V cho Linux (Tauri v2, React, TS, Tailwind, Rust) | https://github.com/datluong2409/linux-clipboard |
| OpenMyDear | Open source | Launcher một chạm cho profile app/file/thư mục (Tauri v2, React, TS, Rust) | https://github.com/datluong2409/openmydear |
| odata2orm | Open source | Thư viện chuyển truy vấn OData sang filter Prisma, TypeORM, Sequelize, Mongoose | https://github.com/datluong2409/odata2orm |

Bản tiếng Việt do Claude soạn; chủ dự án đọc lại trước khi deploy.

**Experience.** Timeline với hai mục placeholder (chức danh, công ty, thời gian, 2–3 gạch đầu dòng, tất cả `TODO`). Số mục và nội dung do chủ dự án cung cấp.

**Contact.** Câu mời "Let's build something together"; ba link: email `mark.dat.code@gmail.com` (`mailto:`), LinkedIn `https://www.linkedin.com/in/dat-luong/`, GitHub `https://github.com/datluong2409`. Không có form. Footer: bản quyền và dòng "Assembled by Mai, Kai, Linh, Alex, Sora and Minh".

### 5.2 Ảnh trống

Component `<Photo slot="...">` hiển thị khung viền nét đứt đúng tỷ lệ (`aspect-ratio`, không gây layout shift) với nhãn tên slot. Slot: `avatar` (Hero), `about` (About), `project-<slug>` (6 cái). Khi `profile.photos[slot]` có giá trị, component render `<img>` có `width`/`height`, `alt`, `loading="lazy"` (trừ avatar). Ảnh đặt trong `public/images/` (WebP/AVIF); chủ dự án chỉ sửa `src/content/profile.ts` và thả file ảnh vào.

### 5.3 Presence bar

Sáu avatar tròn (chữ cái đầu, nền màu của từng người) trong nav. Hover (chuột) hiện tooltip "Mai is editing Projects" theo trạng thái thật của engine, hoặc "Mai is online" khi rảnh. Là trang trí thuần: `aria-hidden="true"`, không focus được. Khi reduced-motion: chỉ hiện avatar tĩnh, không tooltip trạng thái.

## 6. Cursor engine (hướng A: điều phối theo DOM thật)

### 6.1 Nguyên tắc

- Nội dung luôn nằm trong DOM ở đúng layout cuối; engine chỉ điều khiển lớp trình diễn.
- Chỉ animate `transform` và `opacity` trên element thật. Ghost box nằm trong overlay riêng nên được phép animate kích thước mà không gây reflow tài liệu.
- Lõi engine là TypeScript thuần (không phụ thuộc React), nhận thời gian và nguồn ngẫu nhiên qua tham số để test được. React chỉ làm lớp keo.
- Không re-render React mỗi frame: tọa độ con trỏ ghi thẳng vào DOM qua `CursorView`.

### 6.2 Đơn vị và giao diện

| Đơn vị | Trách nhiệm | Phụ thuộc |
|---|---|---|
| `agents.ts` | Danh sách `Agent { id, name, color }` | không |
| `motion-tokens.ts` | Mọi thời lượng, easing, ngưỡng | không |
| `scheduler.ts` | Hàm thuần: `isTriggered`, `nextItem`, `countAgents` | không |
| `path.ts` | Hàm thuần: đường cong Bézier có độ lệch, thời lượng theo khoảng cách | RNG truyền vào |
| `gestures/draw.ts`, `gestures/drop.ts` | Chạy một cử chỉ, trả `Promise<void>`, hủy được bằng `AbortSignal` | `motion` (`animate`), `CursorView` |
| `idle.ts` | Chuyển động lơ lửng khi rảnh và fade-out | `CursorView` |
| `director.ts` | Lớp `Director`: đăng ký section/item, nhận trigger, giao việc, chốt dở dang | các đơn vị trên |
| `CursorLayer.tsx` | Overlay; hiện thực `CursorView` bằng ghi DOM trực tiếp | `director.ts` |
| `useAssemble.ts` | Hook đăng ký một element vào section gần nhất với `{ gesture, order }` | `director.ts` |

```ts
type Gesture = 'draw' | 'drop'
type ItemStatus = 'pending' | 'running' | 'done'

interface Item {
  id: string
  sectionId: string
  el: HTMLElement
  gesture: Gesture
  order: number
  status: ItemStatus
}

interface CursorView {
  setPosition(agentId: AgentId, x: number, y: number): void
  setVisible(agentId: AgentId, visible: boolean): void
  showGhost(agentId: AgentId, rect: Rect | null): void   // khung chọn của cử chỉ "draw"
  setSelection(el: HTMLElement | null, agent: Agent | null): void // viền chọn của "drop"
}
```

`Director` công khai: `registerSection`, `registerItem`, `unregisterItem`, `start`, `dispose`, `setReducedMotion`, `subscribe` (sự kiện trạng thái agent cho presence bar, chỉ phát khi bắt đầu/kết thúc item, không phát mỗi frame).

### 6.3 Kích hoạt

Một section chuyển `pending → running` khi hàm thuần `isTriggered(rect, viewportHeight)` đúng: phần nhìn thấy của section ≥ 35% × `min(chiều cao section, chiều cao viewport)`. Dùng `IntersectionObserver` và `ResizeObserver` để cập nhật. Cách tính này bảo đảm: section cao hơn viewport (Projects) vẫn kích hoạt; section thấp ở cuối trang (Contact) kích hoạt khi cuộn tới đáy. Hero kích hoạt khi tải trang, sau khi `document.fonts.ready`.

Khi một section vừa kích hoạt trong lúc section khác đang chạy, section **mới nhất thắng**: section đang chạy được chốt ngay (6.6). Cuộn smooth qua nhiều section làm các section bị lướt qua được chốt tức thì, section đích chạy hiệu ứng.

Khi tải trang giữa chừng (khôi phục vị trí cuộn, link `#projects`), mọi section nằm hoàn toàn phía trên viewport được đặt `done` ngay.

### 6.4 Giao việc

Item là các khối cấp section (tiêu đề, card, khung ảnh, nút, chip-group). Con của item (chip trong card, dòng chữ trong khối) không phải item; chúng hiện bằng stagger CSS ngắn khi item cha `done`. Ngân sách: mỗi section ≤ 10 item.

Các agent **kéo việc từ hàng đợi chung**, không chia vòng cố định. Một agent rảnh nhận item `pending` có `order` nhỏ nhất mà **đang trong viewport** (`IntersectionObserver` theo từng item, mở rộng 100px). Item nằm dưới nếp gấp đợi tới khi cuộn vào, nên với section dài cuộn tới đâu lắp tới đó. Số agent chạy song song bằng số agent đang bật (6 hoặc 3). Agent khởi động lệch nhau 140ms. Section `done` khi mọi item `done`.

### 6.5 Cử chỉ

Mỗi item có `data-assemble="pending|running|done"` và `data-gesture`.

- **`draw` (card, khung ảnh, nút).** Con trỏ bay tới góc trên-trái của item, rồi kéo sang góc dưới-phải; ghost box viền màu agent (có 4 tay nắm góc) lớn dần theo con trỏ trong overlay. Khi khung đầy, item thật fade-in bên dưới và ghost fade-out.
- **`drop` (tiêu đề, đoạn chữ, chip-group).** Con trỏ bay tới vị trí "khay" của item (lệch khỏi chỗ cuối `(--ax, --ay)` khoảng 60–140px theo hướng cố định theo `order`), nhặt item (item hiện ra tại đó, có viền chọn màu agent và tên), rồi cả hai cùng bay về chỗ cuối. Một giá trị tiến trình duy nhất điều khiển cả transform của item và vị trí con trỏ, nên chúng không bao giờ lệch nhau. Đến nơi, viền chọn tắt.
- Sau mỗi item agent nghỉ 120ms rồi nhận item kế tiếp.
- Trạng thái `done` xóa hết `style` nội tuyến (`transform: none`), không để lại stacking context hay chữ mờ.

CSS ẩn item chỉ áp dụng khi cần:

```css
@media (prefers-reduced-motion: no-preference) {
  .js [data-assemble="pending"] { opacity: 0; }
  .js [data-assemble="pending"][data-gesture="drop"] {
    transform: translate3d(var(--ax, 0), var(--ay, 0), 0) scale(.96);
  }
}
```

`index.html` thêm lớp `js` vào `<html>` bằng script nội tuyến rất sớm, nên tắt JS thì mọi thứ hiện sẵn.

Quyền sở hữu thuộc tính: `data-assemble`, `data-gesture` và biến `--ax`/`--ay` do engine sở hữu. `useAssemble` đặt chúng bằng `useLayoutEffect` (chạy trước khi trình duyệt vẽ) khi đăng ký element, và không render chúng trong JSX, để React re-render (ví dụ khi đổi ngôn ngữ) không ghi đè trạng thái `done` về `pending`.

### 6.6 Ngắt, chốt, rảnh

- **Chốt (`snap`).** Khi section đang chạy bị thay thế: hủy mọi cử chỉ (`AbortController`), đặt các item chưa xong về `done` ngay, xóa ghost/viền chọn. Con trỏ giữ nguyên vị trí hiện tại và quay sang việc mới, không nhảy.
- **Rảnh.** Agent không có việc lơ lửng chậm theo quỹ đạo nhỏ (biên độ 40–90px) quanh vùng thấy được của section, thỉnh thoảng lướt qua một item đã xong. Khi cả section `done`, sau 5s không có trigger mới, mọi con trỏ fade-out hẳn (không để mờ lửng) và vòng `requestAnimationFrame` dừng. Section kích hoạt tiếp theo cho chúng bay vào lại từ rìa viewport.
- **Tab ẩn.** `visibilitychange` tạm dừng; khi quay lại, section đang chạy được chốt.
- **Đổi ngôn ngữ.** Không chạy lại hiệu ứng. Item `pending` được đo vị trí **lúc bắt đầu cử chỉ** nên không bị số liệu cũ. `ResizeObserver` chỉ cập nhật ngưỡng trigger.
- **Reduced motion.** `setReducedMotion(true)` chốt tất cả, tắt overlay và `scroll-behavior: smooth`. Theo dõi `matchMedia` nên bật/tắt khi đang xem cũng đúng.

### 6.7 Toạ độ và overlay

Overlay là `position: absolute; inset: 0; overflow: clip; pointer-events: none` bên trong wrapper `position: relative` bao toàn tài liệu, `aria-hidden="true"`, `z-index: 50` (nav 40, panel menu mobile 60). Toạ độ con trỏ là toạ độ tài liệu (rect của item trừ rect của wrapper), do đó cuộn không làm con trỏ lệch khỏi element. Rect được đo một lần ở đầu mỗi cử chỉ.

### 6.8 Token chuyển động (`motion-tokens.ts`)

| Token | Giá trị |
|---|---|
| Bay giữa hai điểm | `clamp(350 + 0.45 × khoảng cách, 350, 900)` ms, easing `[0.22, 1, 0.36, 1]` |
| Độ cong đường bay | lệch vuông góc ngẫu nhiên 8–18% khoảng cách, RNG theo từng agent |
| `draw` | 500–700ms theo kích thước khung, easing `[0.16, 1, 0.3, 1]` |
| `drop` | 550–800ms, easing `[0.22, 1, 0.36, 1]` |
| Item fade-in | 180ms |
| Ghost / viền chọn tắt | 120ms (nhanh hơn lúc vào) |
| Nghỉ giữa item | 120ms |
| Lệch khởi động giữa agent | 140ms |
| Rảnh tới fade-out | 5000ms, fade 400ms |
| Ngưỡng trigger | 0.35 |

## 7. Song ngữ

- Kiểu `Lang = 'en' | 'vi'`. Mọi chuỗi hiển thị nằm trong `src/content/profile.ts` (nội dung hồ sơ, dạng `{ en, vi }`) và `src/i18n/messages.ts` (chuỗi giao diện).
- Thứ tự quyết định ngôn ngữ: giá trị lưu ở `localStorage['dl:lang']` (bọc try/catch) → `detectLang(navigator.languages)` → `en`.
- `detectLang` là hàm thuần: lấy ngôn ngữ đầu tiên trong danh sách ưu tiên có subtag chính là `vi` hoặc `en`; không có thì `en`.
- Đổi ngôn ngữ cập nhật `<html lang>` và `document.title`. `index.html` tĩnh dùng tiếng Anh cho title/description/OG (không có SSR), đây là hạn chế đã chấp nhận.
- Nút EN | VI là `button` có `aria-pressed`, vùng bấm ≥ 44px trên mobile.

## 8. Truy cập và hiệu năng

- Thứ tự Tab theo thứ tự thị giác, dùng được toàn bộ bằng bàn phím; focus ring luôn nhìn thấy và nav cố định không che phần tử đang focus (`scroll-margin-top` bằng chiều cao nav).
- Heading tuần tự h1 → h2 → h3; mọi ảnh thật có `alt`; khung placeholder có nhãn dễ hiểu; link ngoài mở cùng tab, có `rel="noopener"` khi dùng `target`.
- Vùng bấm ≥ 44×44px trên mobile, khoảng cách giữa các vùng bấm ≥ 8px.
- Không có cuộn ngang ở 375px; dùng `min-height: 100dvh` thay `100vh`.
- Ngân sách: JS ban đầu ≤ 150 KB gzip; CLS < 0.1; chỉ preload font khi thực sự cần.
- Mục tiêu Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95 (đo nếu công cụ chạy được trong môi trường, nếu không ghi rõ là chưa đo).

## 9. Cấu trúc thư mục

```
D:\p\dl-me
├─ index.html                 meta, OG, JSON-LD, script thêm lớp "js", font preload nếu cần
├─ package.json  tsconfig.json  vite.config.ts   (Vitest cấu hình trong vite.config.ts)
├─ .gitignore                 node_modules, dist
├─ public/                    _headers, favicon.svg, og.png (placeholder), robots.txt, images/
├─ docs/superpowers/specs/    tài liệu này
└─ src/
   ├─ main.tsx  App.tsx
   ├─ styles/                 tokens.css, global.css
   ├─ content/profile.ts      toàn bộ nội dung + photos + cvUrl, song ngữ
   ├─ i18n/                   messages.ts, detect.ts, LangProvider.tsx
   ├─ cursors/                agents.ts, motion-tokens.ts, scheduler.ts, path.ts, idle.ts,
   │                          director.ts, CursorLayer.tsx, useAssemble.ts, gestures/{draw,drop}.ts
   ├─ components/             Nav, PresenceBar, LangToggle, Photo, Card, Chip, SectionHeading
   └─ sections/               Hero, About, Skills, Projects, Experience, Contact
```

Dự án đặt ở thư mục gốc repo để Cloudflare Pages build trực tiếp: lệnh `npm run build`, thư mục output `dist`. Các thư mục `.claude/` và `.codegraph/` hiện chưa được theo dõi bởi git và không thuộc phạm vi dự án này.

## 10. Kiểm thử và nghiệm thu

**Unit test (Vitest, jsdom khi cần DOM).**
- `scheduler`: `isTriggered` với section cao hơn viewport, section thấp ở đáy trang, section ngoài màn hình; `nextItem` chọn `order` nhỏ nhất trong số item đang trong viewport, trả `undefined` khi không có.
- `path`: điểm đầu/cuối đúng, thời lượng đơn điệu và bị chặn trong khoảng, kết quả xác định khi RNG cố định.
- `Director` (cử chỉ giả, đồng hồ giả, `CursorView` giả): chạy một section tới `done`; trigger thứ hai trong lúc chạy chốt section đầu; reduced-motion đặt mọi thứ `done` ngay và không hiện con trỏ; section phía trên viewport khi tải trang được đặt `done`; không còn `style` nội tuyến ở trạng thái `done`.
- `detectLang` và thứ tự quyết định ngôn ngữ (lưu trữ → trình duyệt → `en`).

**Kiểm tra trên trình duyệt thật (bước verify).**
1. Tắt JS: cả sáu section hiện đủ nội dung.
2. 1440×900, cuộn từ đầu tới cuối: mỗi section chạy đúng một lần, ≤ khoảng 4 giây, tên và màu con trỏ đúng, không lỗi console.
3. Nhảy nhanh tới `#contact` và cuộn nhanh liên tục: không có element bị ẩn kẹt, trạng thái cuối đầy đủ trong khoảng 300ms sau khi dừng cuộn.
4. Reduced-motion: không con trỏ, không element bị ẩn, không smooth scroll.
5. Đổi EN ↔ VI: không chạy lại hiệu ứng, không tràn layout, `<html lang>` đổi.
6. 375, 768, 1024, 1440px: không cuộn ngang; mobile chỉ có 3 con trỏ; menu mobile dùng được bằng bàn phím.
7. `tsc --noEmit`, `vitest run`, `vite build` đều qua; đo ngân sách JS và CLS; tương phản chữ ≥ 4.5:1; focus nhìn thấy.

## 11. Việc chủ dự án cần cung cấp sau

Ảnh chân dung, ảnh About, sáu ảnh chụp màn hình dự án; file CV; số năm kinh nghiệm, địa điểm, bio; các mục Experience; quyết định xưng "tôi" hay "mình"; đọc lại bản tiếng Việt; ảnh OG; tên miền riêng trên Cloudflare Pages.
