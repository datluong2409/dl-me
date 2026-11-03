import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { Container } from '../components/Container'
import { SectionHeading } from '../components/SectionHeading'
import { Typed } from '../components/Typed'
import { skillGroups } from '../content/profile'
import { Section } from '../cursors/Section'
import { useLang } from '../i18n/LangProvider'
import { ui } from '../i18n/messages'

export function Skills() {
  const { t } = useLang()

  return (
    <Section id="skills" className="py-24">
      <Container>
        <SectionHeading id="skills-title" order={1} eyebrow={ui['section.skills']} title={ui['heading.skills']} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, index) => (
            <Card key={group.id} as="article" order={index + 2} className="flex flex-col gap-4">
              <Typed as="h3" order={1} text={t(group.title)} className="text-lg font-semibold" />
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item, itemIndex) => (
                  <li key={item}>
                    <Chip index={itemIndex + 1}>{item}</Chip>
                  </li>
                ))}
              </ul>
              {group.note && (
                <Typed order={group.items.length + 2} text={t(group.note)} className="text-sm text-fg-muted" />
              )}
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}
