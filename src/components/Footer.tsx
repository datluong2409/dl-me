import { AGENTS } from '../cursors/agents'
import { profile } from '../content/profile'
import { useLang } from '../i18n/LangProvider'
import { Container } from './Container'

export function Footer() {
  const { tr } = useLang()
  const names = AGENTS.map((agent) => agent.name)
  const credit = `${tr('footer.assembled')} ${names.slice(0, -1).join(', ')} ${tr('footer.and')} ${names.at(-1)}`

  return (
    <footer className="border-t border-border py-8 text-sm text-fg-muted">
      <Container className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <p>{`© ${new Date().getFullYear()} ${profile.name}`}</p>
        <p>{credit}</p>
      </Container>
    </footer>
  )
}
