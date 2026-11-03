import { Block } from '../components/Block'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { Container } from '../components/Container'
import { Photo } from '../components/Photo'
import { SectionHeading } from '../components/SectionHeading'
import { profile } from '../content/profile'
import { Section } from '../cursors/Section'
import { useLang } from '../i18n/LangProvider'
import { ui } from '../i18n/messages'

export function About() {
  const { t } = useLang()

  return (
    <Section id="about" className="py-24">
      <Container>
        <SectionHeading id="about-title" order={1} eyebrow={ui['section.about']} title={ui['heading.about']} />
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Block gesture="drop" order={2} className="flex flex-col gap-4">
              <p className="text-lg text-fg">{t(profile.about)}</p>
              <p className="text-fg-muted">{t(profile.openTo)}</p>
            </Block>
            <Block as="ul" gesture="drop" order={3} className="flex flex-wrap gap-2">
              {profile.domains.map((domain, index) => (
                <li key={domain.en}>
                  <Chip index={index}>{t(domain)}</Chip>
                </li>
              ))}
            </Block>
          </div>

          <div className="flex flex-col gap-6">
            <Block gesture="draw" order={4}>
              <Photo slot="about" aspect="aspect-[4/3]" />
            </Block>
            <Card order={5}>
              <dl className="grid grid-cols-2 gap-4">
                {profile.quickFacts.map((fact) => (
                  <div key={fact.label.en}>
                    <dt className="font-mono text-xs tracking-widest text-fg-muted uppercase">{t(fact.label)}</dt>
                    <dd className="mt-1 text-fg">{t(fact.value)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </div>
      </Container>
    </Section>
  )
}
