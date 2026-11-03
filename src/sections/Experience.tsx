import { Card } from '../components/Card'
import { Container } from '../components/Container'
import { SectionHeading } from '../components/SectionHeading'
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
                  <span>{t(entry.role)}</span> <span className="font-normal text-fg-muted">{t(entry.company)}</span>
                </h3>
                <p className="font-mono text-sm text-fg-muted">{t(entry.period)}</p>
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-fg-muted">
                {entry.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex}>{t(bullet)}</li>
                ))}
              </ul>
            </Card>
          ))}
        </ol>
      </Container>
    </Section>
  )
}
