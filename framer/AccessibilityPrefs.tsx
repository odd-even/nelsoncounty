import * as React from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

/**
 * Visit Nelson — Accessibility preferences panel
 * Drop once on the site layout (fixed). Persists prefs in localStorage.
 * Complements built-in site a11y — does not claim WCAG/ADA compliance.
 */

const STORAGE_KEY = "vn-a11y-prefs"
const STYLE_ID = "vn-a11y-styles"

type TextSize = "default" | "large" | "xlarge"
type Corner = "bottom-left" | "bottom-right" | "top-left" | "top-right"

type Prefs = {
    textSize: TextSize
    contrast: boolean
    underlineLinks: boolean
    reduceMotion: boolean
    readable: boolean
}

const DEFAULT_PREFS: Prefs = {
    textSize: "default",
    contrast: false,
    underlineLinks: false,
    reduceMotion: false,
    readable: false,
}

const BRAND = {
    ink: "#1F1C1C",
    forest: "#557645",
    lime: "#C8CE2F",
    olive: "#6C8A0B",
    mist: "#F4F5F0",
    mute: "#636161",
    line: "rgba(31, 28, 28, 0.12)",
    white: "#FFFFFF",
    font: 'Satoshi, "Satoshi Variable", system-ui, -apple-system, sans-serif',
}

function loadPrefs(): Prefs {
    if (typeof window === "undefined") return DEFAULT_PREFS
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return DEFAULT_PREFS
        return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
    } catch {
        return DEFAULT_PREFS
    }
}

function savePrefs(prefs: Prefs) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
        /* ignore */
    }
}

function ensureStyles() {
    if (typeof document === "undefined") return
    if (document.getElementById(STYLE_ID)) return
    const el = document.createElement("style")
    el.id = STYLE_ID
    el.textContent = `
html[data-vn-text="large"] { font-size: 112.5% !important; }
html[data-vn-text="xlarge"] { font-size: 125% !important; }

html[data-vn-contrast="on"] {
  filter: contrast(1.15) saturate(0.92);
}
html[data-vn-contrast="on"] img,
html[data-vn-contrast="on"] video,
html[data-vn-contrast="on"] canvas,
html[data-vn-contrast="on"] [data-vn-a11y-root] {
  filter: none !important;
}

html[data-vn-underline="on"] a {
  text-decoration: underline !important;
  text-underline-offset: 0.18em !important;
  text-decoration-thickness: 0.08em !important;
}

html[data-vn-motion="on"] *,
html[data-vn-motion="on"] *::before,
html[data-vn-motion="on"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

html[data-vn-readable="on"] body {
  letter-spacing: 0.02em !important;
  word-spacing: 0.06em !important;
  line-height: 1.7 !important;
}
html[data-vn-readable="on"] p,
html[data-vn-readable="on"] li,
html[data-vn-readable="on"] [data-framer-component-type="Text"] {
  line-height: 1.75 !important;
}
`
    document.head.appendChild(el)
}

function applyPrefs(prefs: Prefs) {
    if (typeof document === "undefined") return
    ensureStyles()
    const root = document.documentElement
    root.setAttribute("data-vn-text", prefs.textSize)
    root.setAttribute("data-vn-contrast", prefs.contrast ? "on" : "off")
    root.setAttribute("data-vn-underline", prefs.underlineLinks ? "on" : "off")
    root.setAttribute("data-vn-motion", prefs.reduceMotion ? "on" : "off")
    root.setAttribute("data-vn-readable", prefs.readable ? "on" : "off")
}

function IconPerson() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" />
            <path
                d="M5.5 19.2c1.6-3.2 4-4.8 6.5-4.8s4.9 1.6 6.5 4.8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    )
}

function IconClose() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    )
}

type Props = {
    corner?: Corner
    offsetX?: number
    offsetY?: number
    zIndex?: number
    label?: string
    accent?: string
    style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 56
 * @framerIntrinsicHeight 56
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AccessibilityPrefs(props: Props) {
    const {
        corner = "bottom-left",
        offsetX = 20,
        offsetY = 20,
        zIndex = 2147483000,
        label = "Accessibility preferences",
        accent = BRAND.lime,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [mounted, setMounted] = React.useState(false)
    const [open, setOpen] = React.useState(false)
    const [prefs, setPrefs] = React.useState<Prefs>(DEFAULT_PREFS)
    const panelRef = React.useRef<HTMLDivElement>(null)
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    React.useEffect(() => {
        setMounted(true)
        const initial = loadPrefs()
        setPrefs(initial)
        applyPrefs(initial)
    }, [])

    React.useEffect(() => {
        if (!mounted || isCanvas) return
        applyPrefs(prefs)
        savePrefs(prefs)
    }, [prefs, mounted, isCanvas])

    React.useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false)
                buttonRef.current?.focus()
            }
        }
        const onPointer = (e: MouseEvent) => {
            const t = e.target as Node
            if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return
            setOpen(false)
        }
        window.addEventListener("keydown", onKey)
        window.addEventListener("mousedown", onPointer)
        return () => {
            window.removeEventListener("keydown", onKey)
            window.removeEventListener("mousedown", onPointer)
        }
    }, [open])

    const update = (patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch }))
    const reset = () => setPrefs({ ...DEFAULT_PREFS })

    const cornerStyle = ((): React.CSSProperties => {
        const base: React.CSSProperties = { position: "fixed", zIndex }
        if (corner.includes("bottom")) base.bottom = offsetY
        else base.top = offsetY
        if (corner.includes("left")) base.left = offsetX
        else base.right = offsetX
        return base
    })()

    const panelAnchor: React.CSSProperties = {
        position: "absolute",
        ...(corner.includes("bottom") ? { bottom: 64 } : { top: 64 }),
        ...(corner.includes("left") ? { left: 0 } : { right: 0 }),
    }

    const activeCount =
        (prefs.textSize !== "default" ? 1 : 0) +
        (prefs.contrast ? 1 : 0) +
        (prefs.underlineLinks ? 1 : 0) +
        (prefs.reduceMotion ? 1 : 0) +
        (prefs.readable ? 1 : 0)

    const ui = (
        <div
            data-vn-a11y-root
            style={{
                ...cornerStyle,
                fontFamily: BRAND.font,
                pointerEvents: "auto",
                ...style,
            }}
        >
            {open && (
                <div
                    id="vn-a11y-panel"
                    ref={panelRef}
                    role="dialog"
                    aria-modal="false"
                    aria-label={label}
                    style={{
                        ...panelAnchor,
                        width: 300,
                        maxWidth: "calc(100vw - 32px)",
                        background: BRAND.white,
                        color: BRAND.ink,
                        borderRadius: 18,
                        boxShadow: "0 18px 50px rgba(31,28,28,0.22), 0 2px 8px rgba(31,28,28,0.08)",
                        border: `1px solid ${BRAND.line}`,
                        overflow: "hidden",
                        animation: "vnA11yIn 180ms ease-out",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            padding: "16px 16px 12px",
                            background: `linear-gradient(160deg, ${BRAND.ink} 0%, #2a3324 100%)`,
                            color: BRAND.white,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 11,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: accent,
                                    fontWeight: 700,
                                    marginBottom: 4,
                                }}
                            >
                                Visit Nelson
                            </div>
                            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                                Reading preferences
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false)
                                buttonRef.current?.focus()
                            }}
                            aria-label="Close preferences"
                            style={iconBtnStyle(true)}
                        >
                            <IconClose />
                        </button>
                    </div>

                    <div style={{ padding: 14, display: "grid", gap: 10 }}>
                        <Field label="Text size">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                                {(
                                    [
                                        ["default", "A"],
                                        ["large", "A+"],
                                        ["xlarge", "A++"],
                                    ] as const
                                ).map(([value, caption]) => (
                                    <SegButton
                                        key={value}
                                        active={prefs.textSize === value}
                                        accent={accent}
                                        onClick={() => update({ textSize: value })}
                                        aria-pressed={prefs.textSize === value}
                                        label={
                                            value === "default"
                                                ? "Default text size"
                                                : value === "large"
                                                  ? "Larger text"
                                                  : "Largest text"
                                        }
                                    >
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                fontSize: value === "default" ? 14 : value === "large" ? 16 : 18,
                                            }}
                                        >
                                            {caption}
                                        </span>
                                    </SegButton>
                                ))}
                            </div>
                        </Field>

                        <Toggle
                            label="High contrast"
                            hint="Boost contrast across the page"
                            checked={prefs.contrast}
                            onChange={(v) => update({ contrast: v })}
                            accent={accent}
                        />
                        <Toggle
                            label="Underline links"
                            hint="Make links easier to spot"
                            checked={prefs.underlineLinks}
                            onChange={(v) => update({ underlineLinks: v })}
                            accent={accent}
                        />
                        <Toggle
                            label="Reduce motion"
                            hint="Limit animations and transitions"
                            checked={prefs.reduceMotion}
                            onChange={(v) => update({ reduceMotion: v })}
                            accent={accent}
                        />
                        <Toggle
                            label="Readable spacing"
                            hint="More space between letters and lines"
                            checked={prefs.readable}
                            onChange={(v) => update({ readable: v })}
                            accent={accent}
                        />

                        <button
                            type="button"
                            onClick={reset}
                            style={{
                                marginTop: 2,
                                appearance: "none",
                                border: `1px solid ${BRAND.line}`,
                                background: BRAND.mist,
                                color: BRAND.ink,
                                borderRadius: 12,
                                padding: "11px 14px",
                                fontFamily: BRAND.font,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Reset preferences
                        </button>
                    </div>
                </div>
            )}

            <button
                ref={buttonRef}
                type="button"
                aria-expanded={open}
                aria-controls={open ? "vn-a11y-panel" : undefined}
                aria-label={label}
                onClick={() => setOpen((v) => !v)}
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    border: `1px solid rgba(255,255,255,0.12)`,
                    background: BRAND.ink,
                    color: accent,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    boxShadow: "0 10px 28px rgba(31,28,28,0.28)",
                    position: "relative",
                    fontFamily: BRAND.font,
                }}
            >
                <IconPerson />
                {activeCount > 0 && (
                    <span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            minWidth: 18,
                            height: 18,
                            padding: "0 5px",
                            borderRadius: 999,
                            background: accent,
                            color: BRAND.ink,
                            fontSize: 11,
                            fontWeight: 700,
                            display: "grid",
                            placeItems: "center",
                            lineHeight: 1,
                        }}
                    >
                        {activeCount}
                    </span>
                )}
            </button>

            <style>{`
                @keyframes vnA11yIn {
                  from { opacity: 0; transform: translateY(6px) scale(0.98); }
                  to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    )

    // Canvas preview: show button in-flow so designers can see it
    if (isCanvas || !mounted || typeof document === "undefined") {
        return (
            <div
                style={{
                    width: 56,
                    height: 56,
                    display: "grid",
                    placeItems: "center",
                    ...style,
                }}
            >
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: BRAND.ink,
                        color: accent,
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    <IconPerson />
                </div>
            </div>
        )
    }

    return createPortal(ui, document.body)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div
            style={{
                padding: 12,
                borderRadius: 14,
                background: BRAND.mist,
                border: `1px solid ${BRAND.line}`,
            }}
        >
            <div
                style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: BRAND.mute,
                    marginBottom: 8,
                }}
            >
                {label}
            </div>
            {children}
        </div>
    )
}

function SegButton({
    active,
    onClick,
    children,
    accent,
    label,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
    accent: string
    label: string
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={onClick}
            style={{
                appearance: "none",
                border: active ? `1.5px solid ${BRAND.ink}` : `1px solid ${BRAND.line}`,
                background: active ? BRAND.white : "transparent",
                color: BRAND.ink,
                borderRadius: 10,
                padding: "10px 6px",
                cursor: "pointer",
                boxShadow: active ? `inset 0 -2px 0 ${accent}` : "none",
                fontFamily: BRAND.font,
            }}
        >
            {children}
        </button>
    )
}

function Toggle({
    label,
    hint,
    checked,
    onChange,
    accent,
}: {
    label: string
    hint: string
    checked: boolean
    onChange: (v: boolean) => void
    accent: string
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            style={{
                appearance: "none",
                width: "100%",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 12px",
                borderRadius: 14,
                border: `1px solid ${checked ? "rgba(85,118,69,0.35)" : BRAND.line}`,
                background: checked ? "rgba(200,206,47,0.16)" : BRAND.white,
                cursor: "pointer",
                fontFamily: BRAND.font,
                color: BRAND.ink,
            }}
        >
            <span>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>{label}</span>
                <span style={{ display: "block", fontSize: 12, color: BRAND.mute, marginTop: 2 }}>{hint}</span>
            </span>
            <span
                aria-hidden="true"
                style={{
                    width: 42,
                    height: 26,
                    borderRadius: 999,
                    background: checked ? BRAND.forest : "#D8D8D4",
                    position: "relative",
                    flexShrink: 0,
                    transition: "background 160ms ease",
                }}
            >
                <span
                    style={{
                        position: "absolute",
                        top: 3,
                        left: checked ? 19 : 3,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: checked ? accent : BRAND.white,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        transition: "left 160ms ease",
                    }}
                />
            </span>
        </button>
    )
}

function iconBtnStyle(onDark: boolean): React.CSSProperties {
    return {
        appearance: "none",
        width: 36,
        height: 36,
        borderRadius: 10,
        border: onDark ? "1px solid rgba(255,255,255,0.14)" : `1px solid ${BRAND.line}`,
        background: onDark ? "rgba(255,255,255,0.08)" : BRAND.mist,
        color: onDark ? BRAND.white : BRAND.ink,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
    }
}

addPropertyControls(AccessibilityPrefs, {
    corner: {
        type: ControlType.Enum,
        title: "Corner",
        options: ["bottom-left", "bottom-right", "top-left", "top-right"],
        optionTitles: ["Bottom left", "Bottom right", "Top left", "Top right"],
        defaultValue: "bottom-left",
    },
    offsetX: {
        type: ControlType.Number,
        title: "Offset X",
        min: 8,
        max: 64,
        step: 1,
        defaultValue: 20,
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        min: 8,
        max: 120,
        step: 1,
        defaultValue: 20,
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z index",
        min: 1,
        max: 2147483647,
        step: 1,
        defaultValue: 2147483000,
    },
    label: {
        type: ControlType.String,
        title: "Button label",
        defaultValue: "Accessibility preferences",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#C8CE2F",
    },
})
