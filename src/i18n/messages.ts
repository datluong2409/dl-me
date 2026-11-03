import type { Localized } from './lang'

const entries = {
  title: { en: 'Dat Luong — Full-stack Developer', vi: 'Dat Luong — Lập trình viên Full-stack' },
  description: {
    en: 'Full-stack developer building scalable web apps with React, NestJS and well-tuned databases. Open to work.',
    vi: 'Lập trình viên Full-stack xây dựng ứng dụng web dễ mở rộng với React, NestJS và cơ sở dữ liệu được tối ưu. Đang sẵn sàng nhận việc.',
  },
  skip: { en: 'Skip to content', vi: 'Chuyển tới nội dung' },

  'nav.about': { en: 'About', vi: 'Giới thiệu' },
  'nav.skills': { en: 'Skills', vi: 'Kỹ năng' },
  'nav.projects': { en: 'Projects', vi: 'Dự án' },
  'nav.experience': { en: 'Experience', vi: 'Kinh nghiệm' },
  'nav.contact': { en: 'Contact', vi: 'Liên hệ' },
  'menu.open': { en: 'Open menu', vi: 'Mở menu' },
  'menu.close': { en: 'Close menu', vi: 'Đóng menu' },
  'lang.label': { en: 'Language', vi: 'Ngôn ngữ' },

  'cta.contact': { en: 'Get in touch', vi: 'Liên hệ ngay' },
  'cta.cv': { en: 'Download CV', vi: 'Tải CV' },

  'kind.live': { en: 'Live', vi: 'Đang chạy' },
  'kind.self-hosted': { en: 'Self-hosted', vi: 'Tự triển khai' },
  'kind.open-source': { en: 'Open source', vi: 'Mã nguồn mở' },

  'photo.label': { en: 'Photo', vi: 'Ảnh' },
  'presence.editing': { en: 'is editing', vi: 'đang chỉnh' },
  'presence.online': { en: 'is online', vi: 'đang trực tuyến' },
  'footer.assembled': { en: 'Assembled by', vi: 'Được lắp ráp bởi' },

  'section.hero': { en: 'Intro', vi: 'Mở đầu' },
  'section.about': { en: 'About', vi: 'Giới thiệu' },
  'section.skills': { en: 'Skills', vi: 'Kỹ năng' },
  'section.projects': { en: 'Projects', vi: 'Dự án' },
  'section.experience': { en: 'Experience', vi: 'Kinh nghiệm' },
  'section.contact': { en: 'Contact', vi: 'Liên hệ' },

  'heading.about': { en: 'Who I am', vi: 'Tôi là ai' },
  'heading.skills': { en: 'What I work with', vi: 'Công nghệ tôi sử dụng' },
  'heading.projects': { en: "Things I've built", vi: 'Những gì tôi đã xây dựng' },
  'heading.experience': { en: "Where I've worked", vi: 'Nơi tôi đã làm việc' },
  'heading.contact': { en: 'Say hello', vi: 'Gửi lời chào' },
} satisfies Record<string, Localized>

export type UiKey = keyof typeof entries

export const ui: Record<UiKey, Localized> = entries
