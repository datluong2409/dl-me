import { Footer } from './components/Footer'
import { Nav } from './components/Nav'
import { AssemblyProvider } from './cursors/AssemblyProvider'
import { LangProvider, useLang } from './i18n/LangProvider'
import { About } from './sections/About'
import { Contact } from './sections/Contact'
import { Experience } from './sections/Experience'
import { Hero } from './sections/Hero'
import { Projects } from './sections/Projects'
import { Skills } from './sections/Skills'

function Page() {
  const { tr } = useLang()
  return (
    <>
      <a
        className="absolute -top-16 left-4 z-[100] rounded-xl bg-accent px-4 py-3 font-semibold text-bg no-underline focus:top-4"
        href="#content"
      >
        {tr('skip')}
      </a>
      <Nav />
      <main id="content">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AssemblyProvider>
        <Page />
      </AssemblyProvider>
    </LangProvider>
  )
}
