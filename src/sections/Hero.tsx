import { Block } from '../components/Block'
import { Container } from '../components/Container'
import { Photo } from '../components/Photo'
import { Typed } from '../components/Typed'
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
            gesture="stamp"
            order={2}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-fg"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            {t(profile.availability)}
          </Block>

          <Typed
            as="h1"
            order={3}
            text={t(profile.heroGreeting)}
            className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-semibold tracking-tight"
          />
          <Typed order={4} text={t(profile.role)} className="max-w-xl text-xl text-fg" />
          <Typed order={5} text={t(profile.pitch)} className="max-w-xl text-fg-muted" />

          <Block gesture="group" order={6} className="flex flex-wrap gap-3">
            <Block
              as="a"
              gesture="draw"
              order={1}
              href="#contact"
              className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-bg"
            >
              <Typed as="span" order={1} text={tr('cta.contact')} />
            </Block>
            {profile.cvUrl && (
              <Block
                as="a"
                gesture="draw"
                order={2}
                href={profile.cvUrl}
                download
                className="inline-flex min-h-11 items-center rounded-full border border-border px-6 font-semibold text-fg transition-colors hover:bg-surface"
              >
                <Typed as="span" order={1} text={tr('cta.cv')} />
              </Block>
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
