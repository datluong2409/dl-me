import { Card } from '../components/Card'
import { Container } from '../components/Container'
import { SectionHeading } from '../components/SectionHeading'
import { Typed } from '../components/Typed'
import { experience } from '../content/profile'
import { Section } from '../cursors/Section'
import { useLang } from '../i18n/LangProvider'
import { ui } from '../i18n/messages'

export function Experience() {
  const { t } = useLang()

  return (
    <Section id="experience" className="py-24">
      <Container>
        <SectionHeading id="experience-title" order={1} eyebrow={ui['section.experience']} title={ui['heading.experience']} />
        <ol className="flex flex-col gap-4">
          {experience.map((entry, index) => (
            <Card key={entry.id} as="li" order={index + 2}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold">
                  <Typed as="span" order={1} text={t(entry.role)} />{' '}
                  <Typed as="span" order={2} text={t(entry.company)} className="font-normal text-fg-muted" />
                </h3>
                <Typed order={3} text={t(entry.period)} className="font-mono text-sm text-fg-muted" />
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-fg-muted">
                {entry.bullets.map((bullet, bulletIndex) => (
                  <Typed key={bulletIndex} as="li" order={bulletIndex + 4} text={t(bullet)} />
                ))}
              </ul>
            </Card>
          ))}
        </ol>
      </Container>
    </Section>
  )
}
