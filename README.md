# Dat Luong — portfolio

Landing page xin việc song ngữ (EN/VI). Cả trang được một nhóm con trỏ có tên (Mai, Kai, Linh, Alex, Sora, Minh) "lắp ráp" khi bạn cuộn tới từng section.

Vite + React 19 + TypeScript + Tailwind CSS v4 + Motion. Deploy tĩnh lên Cloudflare Pages.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173
npm run verify     # typecheck + test + build + kiểm tra dung lượng JS (≤ 150 KB gzip)
```

## Chỉnh nội dung

Toàn bộ chữ trên trang nằm trong hai file, mỗi chuỗi có bản `en` và `vi`:

- `src/content/profile.ts`: giới thiệu, kỹ năng, dự án, kinh nghiệm, liên hệ.
- `src/i18n/messages.ts`: chuỗi giao diện (menu, nút, tiêu đề section).

Các chuỗi bắt đầu bằng `TODO` là thông tin README GitHub không có, cần bạn điền: số năm kinh nghiệm, địa điểm, và hai mục Experience. Bản tiếng Việt do Claude soạn, bạn nên đọc lại. Tiếng Việt xưng "tôi"; đổi sang "mình" thì sửa trong hai file trên.

Tag công nghệ của HireZin, Transtube, MealGoGo là mô tả chung vì README không nêu stack; sửa trong `projects` nếu muốn.

## Thêm ảnh và CV

Ảnh còn trống hiện là khung nét đứt có nhãn. Để thay bằng ảnh thật:

1. Thả file (WebP/AVIF) vào `public/images/`.
2. Điền `photos` trong `src/content/profile.ts`, ví dụ:

   ```ts
   photos: {
     avatar: { src: '/images/avatar.webp', width: 800, height: 1000, alt: { en: 'Portrait of Dat', vi: 'Ảnh chân dung của Dat' } },
   },
   ```

   Các slot: `avatar`, `about`, và `project-<slug>` (`project-hirezin`, `project-transtube`, `project-mealgogo`, `project-linux-clipboard`, `project-openmydear`, `project-odata2orm`). Khung đã đặt sẵn tỷ lệ nên ảnh thật không làm trang bị dịch. Nếu ảnh lỗi, khung placeholder tự hiện lại.
3. CV: đặt file vào `public/` (ví dụ `public/cv.pdf`) rồi đặt `cvUrl: '/cv.pdf'`. Nút "Download CV" chỉ hiện khi có `cvUrl`.

## Ảnh chia sẻ (Open Graph)

`public/og.png` hiện là ảnh nền trơn 1200×630, hãy thay bằng ảnh thật. Trong `index.html`, `og:image` đang là đường dẫn tương đối `/og.png`; khi đã có tên miền, đổi thành URL tuyệt đối (ví dụ `https://tenmien.com/og.png`) để mạng xã hội hiển thị được ảnh.

## Deploy Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- `public/_headers` đã cấu hình cache lâu dài cho file có hash trong `/assets/`.

## Quy ước

- **Style chỉ bằng class Tailwind.** File `.css` chỉ được chứa `@import`, `@source` và khối `@theme` (token, keyframes); `src/styles/no-custom-css.test.ts` kiểm tra điều này. Tailwind chỉ quét `index.html` và `src/`, nên class đặt ở file ngoài `src/` cần thêm một dòng `@source` trong `src/styles/global.css`.
- Hiệu ứng lắp ráp nằm ở `src/cursors/`. Phần tử nào muốn được lắp ráp thì dùng component `Block` (hoặc `Card`) với `gesture` (`draw` cho khối có khung, `drop` cho chữ) và `order`. Mỗi section tối đa 10 item.
- Khi bật `prefers-reduced-motion`, trang hiện tĩnh và không có con trỏ.
- Số con trỏ (6 trên desktop, 3 dưới 768px) được chốt lúc tải trang.
