import { ArrowUpRight } from '@phosphor-icons/react'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { Container } from '../components/Container'
import { Photo } from '../components/Photo'
import { SectionHeading } from '../components/SectionHeading'
import { projects } from '../content/profile'
import { Section } from '../cursors/Section'
import { useLang } from '../i18n/LangProvider'
import { ui } from '../i18n/messages'

export function Projects() {
  const { t, tr } = useLang()

  return (
    <Section id="projects" className="py-24">
      <Container>
        <SectionHeading id="projects-title" order={1} eyebrow={ui['section.projects']} title={ui['heading.projects']} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Card
              key={project.slug}
              as="article"
              order={index + 2}
              className="relative flex flex-col gap-4 transition-colors hover:border-fg-muted"
            >
              <Photo slot={`project-${project.slug}`} aspect="aspect-[16/10]" />
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-semibold">
                  <a href={project.href} className="inline-flex items-center gap-1 after:absolute after:inset-0">
                    {project.name}
                    <ArrowUpRight aria-hidden="true" size={18} weight="bold" />
                  </a>
                </h3>
                <span
                  className={`rounded-full border border-border px-2 py-0.5 font-mono text-xs ${
                    project.kind === 'live' ? 'text-accent' : 'text-fg-muted'
                  }`}
                >
                  {tr(`kind.${project.kind}`)}
                </span>
              </div>
              <p className="text-fg-muted">{t(project.summary)}</p>
              <ul className="mt-auto flex flex-wrap gap-2">
                {project.stack.map((tag, tagIndex) => (
                  <li key={tag}>
                    <Chip index={tagIndex}>{tag}</Chip>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}
