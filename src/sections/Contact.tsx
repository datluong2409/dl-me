import { EnvelopeSimple, GithubLogo, LinkedinLogo } from '@phosphor-icons/react'
import { Block } from '../components/Block'
import { Container } from '../components/Container'
import { SectionHeading } from '../components/SectionHeading'
import { Typed } from '../components/Typed'
import { profile } from '../content/profile'
import { Section } from '../cursors/Section'
import { useLang } from '../i18n/LangProvider'
import { ui } from '../i18n/messages'

const LINK =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 font-medium text-fg transition-colors hover:bg-surface'

export function Contact() {
  const { t } = useLang()
  const { email, linkedin, github, invite } = profile.contact

  return (
    <Section id="contact" className="py-24">
      <Container>
        <SectionHeading id="contact-title" order={1} eyebrow={ui['section.contact']} title={ui['heading.contact']} />
        <Typed order={2} text={t(invite)} className="mb-8 max-w-xl text-2xl text-fg" />
        <Block gesture="group" order={3} className="flex flex-wrap gap-3">
          <Block
            as="a"
            gesture="draw"
            order={1}
            href={`mailto:${email}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-bg"
          >
            <EnvelopeSimple aria-hidden="true" size={20} weight="bold" />
            <Typed as="span" order={1} text={email} />
          </Block>
          <Block as="a" gesture="draw" order={2} href={linkedin} className={LINK}>
            <LinkedinLogo aria-hidden="true" size={20} weight="bold" />
            <Typed as="span" order={1} text="LinkedIn" />
          </Block>
          <Block as="a" gesture="draw" order={3} href={github} className={LINK}>
            <GithubLogo aria-hidden="true" size={20} weight="bold" />
            <Typed as="span" order={1} text="GitHub" />
          </Block>
        </Block>
      </Container>
    </Section>
  )
}
