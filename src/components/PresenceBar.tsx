import { AGENTS } from '../cursors/agents'
import { useAssembly } from '../cursors/context'
import { usePresence } from '../cursors/usePresence'
import { useLang } from '../i18n/LangProvider'

/** Figma-style "who is here" avatars. Purely decorative, so hidden from assistive technology. */
export function PresenceBar() {
  const assembly = useAssembly()
  const presence = usePresence()
  const { tr } = useLang()
  const agents = assembly?.agents ?? AGENTS

  return (
    <div aria-hidden="true" className="hidden -space-x-2 sm:flex">
      {agents.map((agent) => {
        const section = presence[agent.id]
        const status = section ? `${tr('presence.editing')} ${tr(`section.${section}`)}` : tr('presence.online')
        return (
          <div key={agent.id} className="group/avatar relative">
            <span
              data-avatar={agent.id}
              style={{ backgroundColor: agent.color }}
              className="grid size-7 place-items-center rounded-full border-2 border-bg font-mono text-xs font-medium text-bg"
            >
              {agent.name[0]}
            </span>
            <span className="pointer-events-none absolute top-full right-0 mt-2 hidden rounded-lg border border-border bg-surface px-2 py-1 text-xs whitespace-nowrap text-fg group-hover/avatar:block">
              {`${agent.name} ${status}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
