import { useLang } from '../i18n/LangProvider'
import type { Localized } from '../i18n/lang'
import { Block } from './Block'
import { Typed } from './Typed'

export function SectionHeading({
  id,
  eyebrow,
  title,
  order,
}: {
  id: string
  eyebrow: Localized
  title: Localized
  order: number
}) {
  const { t } = useLang()
  return (
    <Block as="header" gesture="group" order={order} className="mb-10 max-w-2xl">
      <Typed order={1} text={t(eyebrow)} className="font-mono text-xs tracking-widest text-accent uppercase" />
      <Typed
        as="h2"
        order={2}
        id={id}
        text={t(title)}
        className="mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
      />
    </Block>
  )
}
