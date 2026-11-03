import { Block } from '../components/Block'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { Container } from '../components/Container'
import { Photo } from '../components/Photo'
import { SectionHeading } from '../components/SectionHeading'
import { Typed } from '../components/Typed'
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
            <Block gesture="group" order={2} className="flex flex-col gap-4">
              <Typed order={1} text={t(profile.about)} className="text-lg text-fg" />
              <Typed order={2} text={t(profile.openTo)} className="text-fg-muted" />
            </Block>
            <Block as="ul" gesture="group" order={3} className="flex flex-wrap gap-2">
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
                {profile.quickFacts.map((fact, index) => (
                  <div key={fact.label.en}>
                    <Typed
                      as="dt"
                      order={index * 2 + 1}
                      text={t(fact.label)}
                      className="font-mono text-xs tracking-widest text-fg-muted uppercase"
                    />
                    <Typed as="dd" order={index * 2 + 2} text={t(fact.value)} className="mt-1 text-fg" />
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
