import { ArrowUpRight } from '@phosphor-icons/react'
import { Block } from '../components/Block'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { Container } from '../components/Container'
import { Photo } from '../components/Photo'
import { SectionHeading } from '../components/SectionHeading'
import { Typed } from '../components/Typed'
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
              <Block gesture="draw" order={1}>
                <Photo slot={`project-${project.slug}`} aspect="aspect-[16/10]" />
              </Block>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-semibold">
                  <Typed
                    as="a"
                    order={2}
                    href={project.href}
                    text={project.name}
                    className="after:absolute after:inset-0"
                    trailing={<ArrowUpRight aria-hidden="true" size={18} weight="bold" className="ml-1 inline align-text-bottom" />}
                  />
                </h3>
                <Block
                  as="span"
                  gesture="stamp"
                  order={3}
                  className={`rounded-full border border-border px-2 py-0.5 font-mono text-xs ${
                    project.kind === 'live' ? 'text-accent' : 'text-fg-muted'
                  }`}
                >
                  {tr(`kind.${project.kind}`)}
                </Block>
              </div>
              <Typed order={4} text={t(project.summary)} className="text-fg-muted" />
              <ul className="mt-auto flex flex-wrap gap-2">
                {project.stack.map((tag, tagIndex) => (
                  <li key={tag}>
                    <Chip index={tagIndex + 4}>{tag}</Chip>
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
