import { useLang } from '../i18n/LangProvider'
import type { Localized } from '../i18n/lang'
import { Block } from './Block'

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
    <Block as="header" gesture="drop" order={order} className="mb-10 max-w-2xl">
      <p className="font-mono text-xs tracking-widest text-accent uppercase">{t(eyebrow)}</p>
      <h2 id={id} className="mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        {t(title)}
      </h2>
    </Block>
  )
}
