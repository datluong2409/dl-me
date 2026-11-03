import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { Container } from '../components/Container'
import { SectionHeading } from '../components/SectionHeading'
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
              <h3 className="text-lg font-semibold">{t(group.title)}</h3>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item, itemIndex) => (
                  <li key={item}>
                    <Chip index={itemIndex}>{item}</Chip>
                  </li>
                ))}
              </ul>
              {group.note && <p className="text-sm text-fg-muted">{t(group.note)}</p>}
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}
