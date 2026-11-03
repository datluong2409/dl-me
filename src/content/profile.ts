import type { Localized } from '../i18n/lang'

// Everything the page says about Dat lives in this file. Strings that start with "TODO"
// are placeholders for facts the README does not state; replace them before deploying.

export type PhotoSlot = 'avatar' | 'about' | `project-${string}`

export interface PhotoAsset {
  src: string
  width: number
  height: number
  alt: Localized
}

export type ProjectKind = 'live' | 'self-hosted' | 'open-source'

export interface Project {
  slug: string
  name: string
  kind: ProjectKind
  summary: Localized
  stack: string[]
  href: string
}

export interface SkillGroup {
  id: 'frontend' | 'backend' | 'databases' | 'devops' | 'desktop-ai'
  title: Localized
  items: string[]
  note?: Localized
}

export interface ExperienceEntry {
  id: string
  role: Localized
  company: Localized
  period: Localized
  bullets: Localized[]
}

export interface Profile {
  name: string
  heroGreeting: Localized
  role: Localized
  pitch: Localized
  availability: Localized
  about: Localized
  openTo: Localized
  domains: Localized[]
  quickFacts: { label: Localized; value: Localized }[]
  contact: { email: string; linkedin: string; github: string; invite: Localized }
  /** Set to e.g. '/cv.pdf' (file in public/) to show the "Download CV" button. */
  cvUrl?: string
  /** Fill a slot to replace its placeholder frame with a real image from public/images/. */
  photos: Partial<Record<PhotoSlot, PhotoAsset>>
}

const l = (en: string, vi: string): Localized => ({ en, vi })

export const profile: Profile = {
  name: 'Dat Luong',
  heroGreeting: l("Hi, I'm Dat Luong.", 'Xin chào, tôi là Dat Luong.'),
  role: l(
    'Full-stack developer — React, NestJS, and databases that stay fast.',
    'Full-stack developer — React, NestJS và cơ sở dữ liệu luôn nhanh.',
  ),
  pitch: l(
    'I build secure, scalable web apps and ship them with CI/CD. Recently: AI-powered products for hiring and for learning from video.',
    'Tôi xây dựng ứng dụng web an toàn, dễ mở rộng và triển khai bằng CI/CD. Gần đây tôi làm các sản phẩm AI cho tuyển dụng và học từ video.',
  ),
  availability: l('Open to work', 'Sẵn sàng nhận việc'),
  about: l(
    "I'm a full-stack developer focused on robust, scalable web applications with React, NestJS, SQL Server and PostgreSQL. I care about secure REST APIs, well-designed schemas and queries that stay fast, clean interfaces built with React and Tailwind CSS, and delivery pipelines that are ready from day one with GitHub Actions and Cloudflare.",
    'Tôi là full-stack developer, tập trung vào các ứng dụng web vững chắc, dễ mở rộng với React, NestJS, SQL Server và PostgreSQL. Tôi quan tâm tới REST API an toàn, schema được thiết kế tốt và truy vấn luôn nhanh, giao diện gọn gàng xây bằng React và Tailwind CSS, cùng quy trình triển khai sẵn sàng từ ngày đầu với GitHub Actions và Cloudflare.',
  ),
  openTo: l(
    'Open to freelance, startup, and on-site roles.',
    'Sẵn sàng làm freelance, cho startup hoặc làm việc tại văn phòng.',
  ),
  domains: [
    l('Healthcare', 'Y tế'),
    l('Real Estate', 'Bất động sản'),
    l('Food Ordering & Billing', 'Đặt đồ ăn & thanh toán'),
    l('HR & Recruitment', 'Nhân sự & Tuyển dụng'),
  ],
  quickFacts: [
    { label: l('Experience', 'Kinh nghiệm'), value: l('5+ years', '5+ năm') },
    { label: l('Location', 'Địa điểm'), value: l('Da Nang, Vietnam', 'Đà Nẵng, Việt Nam') },
  ],
  contact: {
    email: 'mark.dat.code@gmail.com',
    linkedin: 'https://www.linkedin.com/in/dat-luong/',
    github: 'https://github.com/datluong2409',
    invite: l("Let's build something together.", 'Cùng xây dựng điều gì đó nhé.'),
  },
  cvUrl: undefined,
  photos: {},
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'frontend',
    title: l('Frontend', 'Frontend'),
    items: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS'],
  },
  {
    id: 'backend',
    title: l('Backend', 'Backend'),
    items: ['Node.js', 'NestJS', 'REST APIs'],
  },
  {
    id: 'databases',
    title: l('Databases', 'Cơ sở dữ liệu'),
    items: ['SQL Server', 'PostgreSQL'],
    note: l('Indexing, query tuning, schema design', 'Index, tối ưu truy vấn, thiết kế schema'),
  },
  {
    id: 'devops',
    title: l('DevOps', 'DevOps'),
    items: ['GitHub Actions', 'Cloudflare'],
  },
  {
    id: 'desktop-ai',
    title: l('Desktop & AI', 'Desktop & AI'),
    items: ['Tauri v2', 'Rust', 'OpenAI', 'Claude', 'Gemini'],
  },
]

export const projects: Project[] = [
  {
    slug: 'hirezin',
    name: 'HireZin',
    kind: 'live',
    summary: l(
      'An applicant tracking system where AI screens and ranks candidates against the job requirements.',
      'Hệ thống quản lý tuyển dụng (ATS) dùng AI để sàng lọc và xếp hạng ứng viên theo yêu cầu công việc.',
    ),
    stack: ['AI screening', 'ATS'],
    href: 'https://www.hirezin.com/',
  },
  {
    slug: 'transtube',
    name: 'Transtube',
    kind: 'live',
    summary: l(
      'A browser extension that turns YouTube videos into summaries, transcripts and interactive chat, with OpenAI, Claude, Gemini or local models.',
      'Tiện ích trình duyệt biến video YouTube thành bản tóm tắt, transcript và hội thoại tương tác, chạy với OpenAI, Claude, Gemini hoặc model cục bộ.',
    ),
    stack: ['Browser extension', 'OpenAI', 'Claude', 'Gemini'],
    href: 'https://www.transtubee.com/en/',
  },
  {
    slug: 'mealgogo',
    name: 'MealGoGo',
    kind: 'self-hosted',
    summary: l(
      'Group food ordering without installing an app: orders are collected from one shared link, billing stays transparent.',
      'Đặt đồ ăn theo nhóm mà không cần cài app: gom đơn từ một link chung, tính tiền minh bạch.',
    ),
    stack: ['Web app', 'Group orders'],
    href: 'https://github.com/datluong2409/mealgogo',
  },
  {
    slug: 'linux-clipboard',
    name: 'Linux Clipboard',
    kind: 'open-source',
    summary: l(
      'A Win+V style clipboard history manager for Ubuntu and GNOME, with searchable history and pinned snippets.',
      'Trình quản lý lịch sử clipboard kiểu Win+V cho Ubuntu và GNOME, có tìm kiếm lịch sử và ghim đoạn văn bản.',
    ),
    stack: ['Tauri v2', 'React', 'TypeScript', 'Tailwind CSS', 'Rust'],
    href: 'https://github.com/datluong2409/linux-clipboard',
  },
  {
    slug: 'openmydear',
    name: 'OpenMyDear',
    kind: 'open-source',
    summary: l(
      'A one-click desktop launcher that opens a whole profile of apps, files and folders in parallel or in sequence.',
      'Launcher desktop một chạm, mở cả một profile gồm ứng dụng, tệp và thư mục song song hoặc theo thứ tự.',
    ),
    stack: ['Tauri v2', 'React', 'TypeScript', 'Rust'],
    href: 'https://github.com/datluong2409/openmydear',
  },
  {
    slug: 'odata2orm',
    name: 'odata2orm',
    kind: 'open-source',
    summary: l(
      'A library that converts OData queries into Prisma, TypeORM, Sequelize and Mongoose filters.',
      'Thư viện chuyển truy vấn OData thành filter cho Prisma, TypeORM, Sequelize và Mongoose.',
    ),
    stack: ['TypeScript', 'Prisma', 'TypeORM', 'Sequelize', 'Mongoose'],
    href: 'https://github.com/datluong2409/odata2orm',
  },
]

export const experience: ExperienceEntry[] = [
  {
    id: 'software-developer',
    role: l('Software Developer', 'Software Developer'),
    company: l('Enlab Software · Da Nang, Vietnam', 'Enlab Software · Đà Nẵng, Việt Nam'),
    period: l('Oct 2021 – Present', 'Th10/2021 – Hiện tại'),
    bullets: [
      l(
        'Full-time full-stack developer on Node.js and React products across healthcare, real estate, food ordering and HR.',
        'Full-stack developer toàn thời gian với Node.js và React, cho các sản phẩm y tế, bất động sản, đặt đồ ăn và nhân sự.',
      ),
      l(
        'Build secure REST APIs, design schemas and tune queries on SQL Server and PostgreSQL, and ship with CI/CD.',
        'Xây dựng REST API an toàn, thiết kế schema, tối ưu truy vấn trên SQL Server và PostgreSQL, triển khai bằng CI/CD.',
      ),
    ],
  },
  {
    id: 'internship-trainee',
    role: l('Internship Trainee', 'Thực tập sinh'),
    company: l('Enlab Software · Da Nang, Vietnam', 'Enlab Software · Đà Nẵng, Việt Nam'),
    period: l('Sep 2021 · 1 month', 'Th9/2021 · 1 tháng'),
    bullets: [
      l(
        'Built backend endpoints with ASP.NET Web API while learning the team’s workflow.',
        'Xây dựng các endpoint backend bằng ASP.NET Web API và làm quen quy trình làm việc của nhóm.',
      ),
      l(
        'Moved on to the Software Developer role at the end of the internship.',
        'Chuyển sang vị trí Software Developer ngay sau kỳ thực tập.',
      ),
    ],
  },
]
