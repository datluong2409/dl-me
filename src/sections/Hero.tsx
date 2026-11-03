import { Block } from '../components/Block'
import { Container } from '../components/Container'
import { Photo } from '../components/Photo'
import { profile } from '../content/profile'
import { Section } from '../cursors/Section'
import { useLang } from '../i18n/LangProvider'

export function Hero() {
  const { t, tr } = useLang()

  return (
    <Section id="hero" className="flex min-h-dvh items-center pt-24 pb-16">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col items-start gap-6">
          <Block
            gesture="drop"
            order={2}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-fg"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            {t(profile.availability)}
          </Block>

          <Block as="h1" gesture="drop" order={3} className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-semibold tracking-tight">
            {t(profile.heroGreeting)}
          </Block>

          <Block as="p" gesture="drop" order={4} className="max-w-xl text-xl text-fg">
            {t(profile.role)}
          </Block>

          <Block as="p" gesture="drop" order={5} className="max-w-xl text-fg-muted">
            {t(profile.pitch)}
          </Block>

          <Block gesture="draw" order={6} className="flex flex-wrap gap-3">
            <a
              href="#contact"
              className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-bg"
            >
              {tr('cta.contact')}
            </a>
            {profile.cvUrl && (
              <a
                href={profile.cvUrl}
                download
                className="inline-flex min-h-11 items-center rounded-full border border-border px-6 font-semibold text-fg transition-colors hover:bg-surface"
              >
                {tr('cta.cv')}
              </a>
            )}
          </Block>
        </div>

        <Block gesture="draw" order={1} className="mx-auto w-full max-w-sm">
          <Photo slot="avatar" aspect="aspect-[4/5]" eager />
        </Block>
      </Container>
    </Section>
  )
}
