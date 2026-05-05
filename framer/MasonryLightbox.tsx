import * as React from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

type ObjectFit = "cover" | "contain" | "fill" | "scale-down"
type SortMode = "newest" | "oldest" | "manual"
type FilterMode = "none" | "range"
type ColumnsMode = "responsive" | "fixed"
type ToolbarPosition = "top" | "bottom"
type FilterLabelMode = "auto" | "date" | "custom"

type PhotoItem = {
    id?: string
    image: string
    alt?: string
    caption?: string
    date?: string
    link?: string
}

function useInView(options: { rootMargin?: string; threshold?: number; once?: boolean } = {}) {
    const { rootMargin = "200px 0px", threshold = 0.08, once = true } = options
    const ref = React.useRef<HTMLElement | null>(null)
    const [inView, setInView] = React.useState(false)

    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }

        let didUnobserve = false
        const obs = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                const visible = !!entry?.isIntersecting
                if (visible) {
                    setInView(true)
                    if (once && !didUnobserve) {
                        didUnobserve = true
                        obs.unobserve(el)
                    }
                } else if (!once) {
                    setInView(false)
                }
            },
            { root: null, rootMargin, threshold }
        )
        obs.observe(el)
        return () => {
            try {
                obs.disconnect()
            } catch {}
        }
    }, [rootMargin, threshold, once])

    return { ref, inView }
}

function asDateMs(value?: string) {
    if (!value) return undefined
    const t = Date.parse(value)
    return Number.isFinite(t) ? t : undefined
}

function formatMonthDay(dateStr: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim())
    if (!m) return dateStr
    const y = Number(m[1])
    const mo = Number(m[2]) - 1
    const d = Number(m[3])
    const dt = new Date(Date.UTC(y, mo, d))
    try {
        return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" }).format(dt)
    } catch {
        return dateStr
    }
}

function useLockedBodyScroll(locked: boolean) {
    React.useEffect(() => {
        if (!locked) return
        const el = document.documentElement
        const prevOverflow = el.style.overflow
        el.style.overflow = "hidden"
        return () => {
            el.style.overflow = prevOverflow
        }
    }, [locked])
}

function useKeydown(enabled: boolean, onKeyDown: (e: KeyboardEvent) => void) {
    React.useEffect(() => {
        if (!enabled) return
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [enabled, onKeyDown])
}

function useRafScrollY(enabled: boolean) {
    const [y, setY] = React.useState(0)
    React.useEffect(() => {
        if (!enabled) return
        let raf = 0
        const onScroll = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => setY(window.scrollY || 0))
        }
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("scroll", onScroll as any)
        }
    }, [enabled])
    return y
}

function useWindowWidth() {
    const [w, setW] = React.useState<number>(() => (typeof window !== "undefined" ? window.innerWidth : 1200))
    React.useEffect(() => {
        const onResize = () => setW(window.innerWidth)
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])
    return w
}

function getColumnsForWidth(width: number, cols: { mobile: number; tablet: number; desktop: number; wide: number }) {
    if (width < 600) return cols.mobile
    if (width < 900) return cols.tablet
    if (width < 1200) return cols.desktop
    return cols.wide
}

export function MasonryLightbox(props: {
    photos: PhotoItem[]
    sort: SortMode
    filterMode: FilterMode
    filterStart: string
    filterEnd: string
    showFilterBar: boolean
    filterBarPosition: ToolbarPosition
    filterAllLabel: string
    filterLabelMode: FilterLabelMode
    filterCustomLabels: string
    filterDropdownWidth: number
    filterDropdownHeight: number
    filterDropdownRadius: number
    filterDropdownBackground: string
    filterDropdownText: string
    filterDropdownFontSize: number
    filterDropdownShadow: string
    filterDropdownIconBackground: string
    filterDropdownIconColor: string
    filterMenuBackground: string
    filterMenuRadius: number
    filterMenuPadding: number
    filterMenuShadow: string
    filterMenuItemHoverBackground: string
    filterMenuAccent: string
    filterBarZIndex: number
    columnsMode: ColumnsMode
    columnsFixed: number
    columnsMobile: number
    columnsTablet: number
    columnsDesktop: number
    columnsWide: number
    gap: number
    radius: number
    objectFit: ObjectFit
    showCaptions: boolean
    captionColor: string
    captionSize: number
    hoverScale: number
    hoverDuration: number
    revealOnScroll: boolean
    revealDuration: number
    revealScaleFrom: number
    revealOnce: boolean
    enableLightbox: boolean
    lightboxBackground: string
    lightboxPadding: number
    lightboxRadius: number
    showArrows: boolean
    showCounter: boolean
    counterColor: string
    preloadNeighbor: boolean
    enableParallax: boolean
    parallaxStrength: number
}) {
    const {
        photos,
        sort,
        filterMode,
        filterStart,
        filterEnd,
        showFilterBar,
        filterBarPosition,
        filterAllLabel,
        filterLabelMode,
        filterCustomLabels,
        filterDropdownWidth,
        filterDropdownHeight,
        filterDropdownRadius,
        filterDropdownBackground,
        filterDropdownText,
        filterDropdownFontSize,
        filterDropdownShadow,
        filterDropdownIconBackground,
        filterDropdownIconColor,
        filterMenuBackground,
        filterMenuRadius,
        filterMenuPadding,
        filterMenuShadow,
        filterMenuItemHoverBackground,
        filterMenuAccent,
        filterBarZIndex,
        columnsMode,
        columnsFixed,
        columnsMobile,
        columnsTablet,
        columnsDesktop,
        columnsWide,
        gap,
        radius,
        objectFit,
        showCaptions,
        captionColor,
        captionSize,
        hoverScale,
        hoverDuration,
        revealOnScroll,
        revealDuration,
        revealScaleFrom,
        revealOnce,
        enableLightbox,
        lightboxBackground,
        lightboxPadding,
        lightboxRadius,
        showArrows,
        showCounter,
        counterColor,
        preloadNeighbor,
        enableParallax,
        parallaxStrength,
    } = props

    const width = useWindowWidth()
    const columnsResponsive = getColumnsForWidth(width, {
        mobile: columnsMobile,
        tablet: columnsTablet,
        desktop: columnsDesktop,
        wide: columnsWide,
    })
    const columns = columnsMode === "fixed" ? columnsFixed : columnsResponsive

    const uniqueDays = React.useMemo(() => {
        const set = new Set<string>()
        for (const p of photos || []) {
            const d = (p?.date || "").trim()
            if (!d) continue
            set.add(d)
        }
        const days = Array.from(set)
        days.sort((a, b) => (asDateMs(b) ?? 0) - (asDateMs(a) ?? 0))
        return days
    }, [photos])

    const ALL_KEY = "__all__"
    const [uiSelectedKey, setUiSelectedKey] = React.useState<string>(ALL_KEY)
    React.useEffect(() => setUiSelectedKey(ALL_KEY), [filterAllLabel])

    const customLabelMap = React.useMemo(() => {
        const map = new Map<string, string>()
        const raw = (filterCustomLabels || "").split("\n")
        for (const line of raw) {
            const t = line.trim()
            if (!t) continue
            const [k, ...rest] = t.split("|")
            const key = (k || "").trim()
            const label = rest.join("|").trim()
            if (!key || !label) continue
            map.set(key, label)
        }
        return map
    }, [filterCustomLabels])

    const filterOptions = React.useMemo(() => {
        const opts: Array<{ key: string; label: string }> = [{ key: ALL_KEY, label: filterAllLabel }]
        for (const day of uniqueDays) {
            let label = day
            if (filterLabelMode === "auto") label = formatMonthDay(day)
            if (filterLabelMode === "custom") label = customLabelMap.get(day) ?? formatMonthDay(day)
            opts.push({ key: day, label })
        }
        return opts
    }, [uniqueDays, filterAllLabel, filterLabelMode, customLabelMap])

    const [filterOpen, setFilterOpen] = React.useState(false)
    const filterWrapRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
        if (!filterOpen) return
        const onDown = (e: MouseEvent) => {
            const target = e.target as Node | null
            if (!target) return
            if (filterWrapRef.current && !filterWrapRef.current.contains(target)) setFilterOpen(false)
        }
        window.addEventListener("mousedown", onDown)
        return () => window.removeEventListener("mousedown", onDown)
    }, [filterOpen])

    useKeydown(
        filterOpen,
        React.useCallback(
            (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    e.preventDefault()
                    setFilterOpen(false)
                }
            },
            [setFilterOpen]
        )
    )

    const effectiveSort: SortMode = sort
    const selectedDay = showFilterBar && uiSelectedKey !== ALL_KEY ? uiSelectedKey.trim() : ""

    const startMs = filterMode === "range" ? asDateMs(filterStart) : undefined
    const endMs = filterMode === "range" ? asDateMs(filterEnd) : undefined

    const normalized = React.useMemo(() => {
        const list = (photos || []).map((p, i) => ({
            id: p.id ?? `${i}`,
            image: p.image,
            alt: p.alt ?? "",
            caption: p.caption ?? "",
            link: p.link ?? "",
            date: (p.date ?? "").trim(),
            dateMs: asDateMs(p.date),
            index: i,
        }))

        const filtered = selectedDay
            ? list.filter((p) => p.date === selectedDay)
            : filterMode === "range" && (startMs !== undefined || endMs !== undefined)
              ? list.filter((p) => {
                    const t = p.dateMs
                    if (t === undefined) return false
                    if (startMs !== undefined && t < startMs) return false
                    if (endMs !== undefined && t > endMs) return false
                    return true
                })
              : list

        const sorted =
            effectiveSort === "manual"
                ? filtered
                : [...filtered].sort((a, b) => {
                      const at = a.dateMs ?? 0
                      const bt = b.dateMs ?? 0
                      return effectiveSort === "newest" ? bt - at : at - bt
                  })

        return sorted
    }, [photos, selectedDay, filterMode, startMs, endMs, effectiveSort])

    const [openIndex, setOpenIndex] = React.useState<number | null>(null)
    const isOpen = enableLightbox && openIndex !== null

    useLockedBodyScroll(isOpen && RenderTarget.current() !== RenderTarget.canvas)

    const scrollY = useRafScrollY(enableParallax && RenderTarget.current() !== RenderTarget.canvas)

    const goTo = React.useCallback(
        (nextIndex: number) => {
            if (!normalized.length) return
            setOpenIndex(((nextIndex % normalized.length) + normalized.length) % normalized.length)
        },
        [normalized.length]
    )

    const close = React.useCallback(() => setOpenIndex(null), [])
    const prev = React.useCallback(() => (openIndex === null ? null : goTo(openIndex - 1)), [openIndex, goTo])
    const next = React.useCallback(() => (openIndex === null ? null : goTo(openIndex + 1)), [openIndex, goTo])

    useKeydown(
        isOpen,
        React.useCallback(
            (e: KeyboardEvent) => {
                if (!isOpen) return
                if (e.key === "Escape") {
                    e.preventDefault()
                    close()
                    return
                }
                if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    prev()
                    return
                }
                if (e.key === "ArrowRight") {
                    e.preventDefault()
                    next()
                }
            },
            [isOpen, close, prev, next]
        )
    )

    const active = isOpen && openIndex !== null ? normalized[openIndex] : null

    React.useEffect(() => {
        if (!isOpen || !preloadNeighbor || openIndex === null) return
        const nextItem = normalized[(openIndex + 1) % normalized.length]
        const prevItem = normalized[(openIndex - 1 + normalized.length) % normalized.length]
        ;[nextItem, prevItem].forEach((it) => {
            if (!it?.image) return
            const img = new Image()
            img.src = it.image
        })
    }, [isOpen, preloadNeighbor, openIndex, normalized])

    const wrapStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        position: "relative",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    }

    const filterBarStyle: React.CSSProperties = {
        position: "sticky",
        top: filterBarPosition === "top" ? 0 : undefined,
        bottom: filterBarPosition === "bottom" ? 0 : undefined,
        zIndex: filterBarZIndex,
        width: filterDropdownWidth,
        marginBottom: filterBarPosition === "top" ? Math.max(8, Math.min(24, gap)) : 0,
        marginTop: filterBarPosition === "bottom" ? Math.max(8, Math.min(24, gap)) : 0,
        positionAnchor: "auto" as any,
    }

    const filterButtonStyle: React.CSSProperties = {
        width: filterDropdownWidth,
        height: filterDropdownHeight,
        borderRadius: filterDropdownRadius,
        background: filterDropdownBackground,
        color: filterDropdownText,
        border: "none",
        outline: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        font: "inherit",
        fontSize: filterDropdownFontSize,
        padding: "0 14px 0 16px",
        cursor: "pointer",
        boxShadow: filterDropdownShadow,
        userSelect: "none",
    }

    const filterIconWrapStyle: React.CSSProperties = {
        width: Math.max(26, Math.floor(filterDropdownHeight * 0.5)),
        height: Math.max(26, Math.floor(filterDropdownHeight * 0.5)),
        borderRadius: 999,
        background: filterDropdownIconBackground,
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
    }

    const filterMenuStyle: React.CSSProperties = {
        position: "absolute",
        left: 0,
        top: filterDropdownHeight + 10,
        width: filterDropdownWidth,
        background: filterMenuBackground,
        borderRadius: filterMenuRadius,
        padding: filterMenuPadding,
        boxShadow: filterMenuShadow,
        zIndex: filterBarZIndex + 1,
    }

    const masonryStyle: React.CSSProperties = {
        columnCount: Math.max(1, Math.round(columns)),
        columnGap: gap,
        width: "100%",
    }

    const itemStyle: React.CSSProperties = {
        breakInside: "avoid",
        WebkitColumnBreakInside: "avoid",
        marginBottom: gap,
        width: "100%",
        display: "inline-block",
        position: "relative",
        transform: "translateZ(0)",
    }

    const revealHiddenStyle: React.CSSProperties = {
        opacity: 0,
        transform: `translate3d(0, 10px, 0) scale(${revealScaleFrom})`,
    }
    const revealVisibleStyle: React.CSSProperties = {
        opacity: 1,
        transform: "translate3d(0, 0, 0) scale(1)",
    }

    const clickableStyle: React.CSSProperties = {
        width: "100%",
        display: "block",
        borderRadius: radius,
        overflow: "hidden",
        cursor: enableLightbox ? "zoom-in" : "pointer",
        textDecoration: "none",
        color: "inherit",
    }

    const imgStyle: React.CSSProperties = {
        width: "100%",
        height: "auto",
        display: "block",
        objectFit,
        transform: "scale(1)",
        transformOrigin: "center",
        transition: `transform ${hoverDuration}s ease`,
        willChange: "transform",
    }

    const captionStyle: React.CSSProperties = {
        marginTop: 8,
        color: captionColor,
        fontSize: captionSize,
        lineHeight: 1.3,
        wordBreak: "break-word",
    }

    const lightboxOverlayStyle: React.CSSProperties = {
        position: "fixed",
        inset: 0,
        background: lightboxBackground,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483647,
        padding: lightboxPadding,
    }

    const lightboxFrameStyle: React.CSSProperties = {
        width: "min(1100px, 100%)",
        maxHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        pointerEvents: "none",
    }

    const lightboxImageWrapStyle: React.CSSProperties = {
        borderRadius: lightboxRadius,
        overflow: "hidden",
        maxHeight: "100%",
        maxWidth: "100%",
        pointerEvents: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        background: "rgba(0,0,0,0.12)",
    }

    const lightboxImgStyle: React.CSSProperties = {
        display: "block",
        maxWidth: "100%",
        maxHeight: "calc(100vh - 2 * var(--lbPad, 24px))",
        width: "auto",
        height: "auto",
        objectFit: "contain",
    }

    const arrowBase: React.CSSProperties = {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        width: 44,
        height: 44,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(0,0,0,0.35)",
        color: "white",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        userSelect: "none",
        pointerEvents: "auto",
        backdropFilter: "blur(8px)",
    }

    const counterStyle: React.CSSProperties = {
        position: "absolute",
        left: "50%",
        top: -8,
        transform: "translate(-50%, -100%)",
        color: counterColor,
        fontSize: 12,
        letterSpacing: 0.2,
        pointerEvents: "none",
        textShadow: "0 2px 10px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
    }

    const lightbox =
        isOpen && active ? (
            <div
                style={{ ...lightboxOverlayStyle, ["--lbPad" as any]: `${lightboxPadding}px` }}
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) close()
                }}
            >
                <div style={lightboxFrameStyle}>
                    {showCounter ? (
                        <div style={counterStyle}>
                            {openIndex! + 1} / {normalized.length}
                        </div>
                    ) : null}

                    {showArrows && normalized.length > 1 ? (
                        <button
                            type="button"
                            style={{ ...arrowBase, left: 0 }}
                            onClick={() => prev()}
                            aria-label="Previous"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M15 18l-6-6 6-6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    ) : null}

                    <div style={lightboxImageWrapStyle}>
                        <img src={active.image} alt={active.alt} style={lightboxImgStyle} />
                    </div>

                    {showArrows && normalized.length > 1 ? (
                        <button type="button" style={{ ...arrowBase, right: 0 }} onClick={() => next()} aria-label="Next">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M9 6l6 6-6 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    ) : null}
                </div>
            </div>
        ) : null

    return (
        <div style={wrapStyle}>
            {showFilterBar ? (
                <div style={filterBarStyle} aria-label="Gallery filter" ref={filterWrapRef as any}>
                    <button
                        type="button"
                        style={filterButtonStyle}
                        onClick={() => setFilterOpen((v) => !v)}
                        aria-haspopup="listbox"
                        aria-expanded={filterOpen}
                    >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {filterOptions.find((o) => o.key === uiSelectedKey)?.label ?? filterAllLabel}
                        </span>
                        <span style={filterIconWrapStyle} aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                    d={filterOpen ? "M7 14l5-5 5 5" : "M7 10l5 5 5-5"}
                                    stroke={filterDropdownIconColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                    </button>

                    {filterOpen ? (
                        <div style={filterMenuStyle} role="listbox" aria-label="Filter options">
                            {filterOptions.map((opt) => {
                                const selected = opt.key === uiSelectedKey
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => {
                                            setUiSelectedKey(opt.key)
                                            setFilterOpen(false)
                                        }}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            padding: "14px 16px",
                                            border: "none",
                                            background: "transparent",
                                            color: selected ? filterMenuAccent : filterDropdownText,
                                            font: "inherit",
                                            fontSize: filterDropdownFontSize,
                                            textAlign: "left",
                                            cursor: "pointer",
                                            borderRadius: Math.max(10, Math.floor(filterMenuRadius * 0.55)),
                                        }}
                                        onMouseEnter={(e) => {
                                            ;(e.currentTarget as HTMLButtonElement).style.background = filterMenuItemHoverBackground
                                        }}
                                        onMouseLeave={(e) => {
                                            ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
                                        }}
                                        role="option"
                                        aria-selected={selected}
                                    >
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {opt.label}
                                        </span>
                                        {selected ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <path
                                                    d="M20 6L9 17l-5-5"
                                                    stroke={filterMenuAccent}
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        ) : (
                                            <span style={{ width: 18, height: 18 }} />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div style={masonryStyle}>
                {normalized.map((p, i) => {
                    const parallax =
                        enableParallax && RenderTarget.current() !== RenderTarget.canvas
                            ? (i % 7) * 0.03 * parallaxStrength
                            : 0
                    const ty = enableParallax ? (scrollY * parallax) / 100 : 0
                    const outer: React.CSSProperties = ty ? { transform: `translate3d(0, ${ty}px, 0)` } : undefined
                    const { ref, inView } = useInView({ rootMargin: "200px 0px", threshold: 0.08, once: revealOnce })
                    const revealStyle =
                        revealOnScroll && RenderTarget.current() !== RenderTarget.canvas
                            ? {
                                  transition: `opacity ${revealDuration}s ease, transform ${revealDuration}s cubic-bezier(0.2, 0.8, 0.2, 1)`,
                                  willChange: "opacity, transform",
                                  ...(inView ? revealVisibleStyle : revealHiddenStyle),
                              }
                            : undefined

                    const onClick = (e: React.MouseEvent) => {
                        if (!enableLightbox) return
                        e.preventDefault()
                        setOpenIndex(i)
                    }

                    const href = enableLightbox ? "#" : p.link || undefined

                    return (
                        <div
                            key={p.id}
                            ref={ref as any}
                            style={{ ...itemStyle, ...outer, ...(revealStyle || {}) }}
                        >
                            <a
                                href={href}
                                style={clickableStyle}
                                onClick={onClick}
                                onMouseEnter={(e) => {
                                    if (hoverScale === 1) return
                                    const img = (e.currentTarget as HTMLAnchorElement).querySelector("img")
                                    if (img) (img as HTMLImageElement).style.transform = `scale(${hoverScale})`
                                }}
                                onMouseLeave={(e) => {
                                    const img = (e.currentTarget as HTMLAnchorElement).querySelector("img")
                                    if (img) (img as HTMLImageElement).style.transform = "scale(1)"
                                }}
                                aria-label={p.alt || "Open image"}
                            >
                                <img
                                    src={p.image}
                                    alt={p.alt}
                                    style={imgStyle}
                                    loading="lazy"
                                    decoding="async"
                                />
                            </a>
                            {showCaptions && (p.caption || p.date) ? (
                                <div style={captionStyle}>
                                    {p.caption ? <div>{p.caption}</div> : null}
                                    {p.date ? <div style={{ opacity: 0.75 }}>{p.date}</div> : null}
                                </div>
                            ) : null}
                        </div>
                    )
                })}
            </div>

            {RenderTarget.current() === RenderTarget.canvas
                ? lightbox
                : typeof document !== "undefined" && lightbox
                  ? createPortal(lightbox, document.body)
                  : null}
        </div>
    )
}

MasonryLightbox.defaultProps = {
    photos: [
        {
            image: "https://framerusercontent.com/images/9hMymxJv5H1O5r7bYQb1cKpV6YQ.jpg",
            alt: "Sample photo",
            caption: "Drop in your images",
            date: "2026-05-01",
        },
        {
            image: "https://framerusercontent.com/images/p8xKXr8eG2cJm9d2bLx1tqQmV8w.jpg",
            alt: "Sample photo 2",
            caption: "Reorder them in the Photos list",
            date: "2026-05-03",
        },
        {
            image: "https://framerusercontent.com/images/1x7Zg2s3vWQw7GZ0qv0uX9h8oHg.jpg",
            alt: "Sample photo 3",
            caption: "Filter by date range",
            date: "2026-05-05",
        },
    ],
    sort: "manual",
    filterMode: "none",
    filterStart: "2026-01-01",
    filterEnd: "2026-12-31",
    showFilterBar: true,
    filterBarPosition: "top",
    filterAllLabel: "All",
    filterLabelMode: "auto",
    filterCustomLabels: "",
    filterDropdownWidth: 150,
    filterDropdownHeight: 56,
    filterDropdownRadius: 28,
    filterDropdownBackground: "rgba(85,85,85,0.95)",
    filterDropdownText: "rgba(255,255,255,0.92)",
    filterDropdownFontSize: 20,
    filterDropdownShadow: "0 12px 30px rgba(0,0,0,0.35)",
    filterDropdownIconBackground: "rgba(255,255,255,0.14)",
    filterDropdownIconColor: "rgba(255,255,255,0.85)",
    filterMenuBackground: "rgba(85,85,85,0.98)",
    filterMenuRadius: 18,
    filterMenuPadding: 8,
    filterMenuShadow: "0 18px 55px rgba(0,0,0,0.45)",
    filterMenuItemHoverBackground: "rgba(255,255,255,0.08)",
    filterMenuAccent: "#1e88ff",
    filterBarZIndex: 50,
    columnsMode: "responsive",
    columnsFixed: 4,
    columnsMobile: 2,
    columnsTablet: 3,
    columnsDesktop: 4,
    columnsWide: 5,
    gap: 16,
    radius: 14,
    objectFit: "cover",
    showCaptions: false,
    captionColor: "rgba(255,255,255,0.85)",
    captionSize: 12,
    hoverScale: 1.02,
    hoverDuration: 0.18,
    revealOnScroll: true,
    revealDuration: 0.38,
    revealScaleFrom: 0.98,
    revealOnce: true,
    enableLightbox: true,
    lightboxBackground: "rgba(0,0,0,0.86)",
    lightboxPadding: 28,
    lightboxRadius: 16,
    showArrows: true,
    showCounter: false,
    counterColor: "rgba(255,255,255,0.85)",
    preloadNeighbor: true,
    enableParallax: false,
    parallaxStrength: 1,
}

addPropertyControls(MasonryLightbox, {
    photos: {
        type: ControlType.Array,
        title: "Photos",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                alt: { type: ControlType.String, title: "Alt" },
                caption: { type: ControlType.String, title: "Caption" },
                date: { type: ControlType.String, title: "Date (YYYY-MM-DD)" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: MasonryLightbox.defaultProps.photos as any,
    },

    sort: {
        type: ControlType.Enum,
        title: "Sort",
        options: ["manual", "newest", "oldest"],
        optionTitles: ["Manual", "Newest", "Oldest"],
        defaultValue: "manual",
    },

    filterMode: {
        type: ControlType.Enum,
        title: "Filter",
        options: ["none", "range"],
        optionTitles: ["None", "Date range"],
        defaultValue: "none",
    },
    filterStart: {
        type: ControlType.String,
        title: "From",
        defaultValue: "2026-01-01",
        hidden: (p) => p.filterMode !== "range",
    },
    filterEnd: {
        type: ControlType.String,
        title: "To",
        defaultValue: "2026-12-31",
        hidden: (p) => p.filterMode !== "range",
    },

    showFilterBar: { type: ControlType.Boolean, title: "Filter bar", defaultValue: true },
    filterAllLabel: {
        type: ControlType.String,
        title: "All label",
        defaultValue: "All",
        hidden: (p) => !p.showFilterBar,
    },
    filterLabelMode: {
        type: ControlType.Enum,
        title: "Labels",
        options: ["auto", "date", "custom"],
        optionTitles: ["Auto (April 3)", "Raw date (YYYY-MM-DD)", "Custom map"],
        defaultValue: "auto",
        hidden: (p) => !p.showFilterBar,
    },
    filterCustomLabels: {
        type: ControlType.String,
        title: "Custom labels",
        defaultValue: "",
        placeholder: "YYYY-MM-DD|April 3",
        hidden: (p) => !p.showFilterBar || p.filterLabelMode !== "custom",
    },
    filterBarPosition: {
        type: ControlType.Enum,
        title: "Bar pos",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "top",
        hidden: (p) => !p.showFilterBar,
    },
    filterDropdownWidth: {
        type: ControlType.Number,
        title: "Filter width",
        min: 100,
        max: 360,
        step: 1,
        defaultValue: 150,
        hidden: (p) => !p.showFilterBar,
    },
    filterDropdownHeight: {
        type: ControlType.Number,
        title: "Filter height",
        min: 36,
        max: 80,
        step: 1,
        defaultValue: 56,
        hidden: (p) => !p.showFilterBar,
    },
    filterDropdownRadius: {
        type: ControlType.Number,
        title: "Filter radius",
        min: 8,
        max: 60,
        step: 1,
        defaultValue: 28,
        hidden: (p) => !p.showFilterBar,
    },
    filterDropdownFontSize: {
        type: ControlType.Number,
        title: "Filter font",
        min: 12,
        max: 28,
        step: 1,
        defaultValue: 20,
        hidden: (p) => !p.showFilterBar,
    },
    filterDropdownBackground: {
        type: ControlType.Color,
        title: "Filter bg",
        defaultValue: "rgba(85,85,85,0.95)",
        hidden: (p) => !p.showFilterBar,
    },
    filterDropdownText: {
        type: ControlType.Color,
        title: "Filter text",
        defaultValue: "rgba(255,255,255,0.92)",
        hidden: (p) => !p.showFilterBar,
    },
    filterDropdownShadow: {
        type: ControlType.String,
        title: "Filter shadow",
        defaultValue: "0 12px 30px rgba(0,0,0,0.35)",
        hidden: (p) => !p.showFilterBar,
    },
    filterDropdownIconBackground: {
        type: ControlType.Color,
        title: "Icon bg",
        defaultValue: "rgba(255,255,255,0.14)",
        hidden: (p) => !p.showFilterBar,
    },
    filterDropdownIconColor: {
        type: ControlType.Color,
        title: "Icon color",
        defaultValue: "rgba(255,255,255,0.85)",
        hidden: (p) => !p.showFilterBar,
    },
    filterMenuBackground: {
        type: ControlType.Color,
        title: "Menu bg",
        defaultValue: "rgba(85,85,85,0.98)",
        hidden: (p) => !p.showFilterBar,
    },
    filterMenuRadius: {
        type: ControlType.Number,
        title: "Menu radius",
        min: 8,
        max: 40,
        step: 1,
        defaultValue: 18,
        hidden: (p) => !p.showFilterBar,
    },
    filterMenuPadding: {
        type: ControlType.Number,
        title: "Menu pad",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 8,
        hidden: (p) => !p.showFilterBar,
    },
    filterMenuShadow: {
        type: ControlType.String,
        title: "Menu shadow",
        defaultValue: "0 18px 55px rgba(0,0,0,0.45)",
        hidden: (p) => !p.showFilterBar,
    },
    filterMenuItemHoverBackground: {
        type: ControlType.Color,
        title: "Hover bg",
        defaultValue: "rgba(255,255,255,0.08)",
        hidden: (p) => !p.showFilterBar,
    },
    filterMenuAccent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#1e88ff",
        hidden: (p) => !p.showFilterBar,
    },
    filterBarZIndex: {
        type: ControlType.Number,
        title: "Filter z",
        min: 0,
        max: 9999,
        step: 1,
        defaultValue: 50,
        hidden: (p) => !p.showFilterBar,
    },

    columnsMode: {
        type: ControlType.Enum,
        title: "Columns",
        options: ["responsive", "fixed"],
        optionTitles: ["Responsive", "Fixed"],
        defaultValue: "responsive",
    },
    columnsFixed: {
        type: ControlType.Number,
        title: "Fixed",
        min: 1,
        max: 12,
        step: 1,
        defaultValue: 4,
        hidden: (p) => p.columnsMode !== "fixed",
    },
    columnsMobile: {
        type: ControlType.Number,
        title: "Mobile",
        min: 1,
        max: 6,
        step: 1,
        defaultValue: 2,
        hidden: (p) => p.columnsMode !== "responsive",
    },
    columnsTablet: {
        type: ControlType.Number,
        title: "Tablet",
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 3,
        hidden: (p) => p.columnsMode !== "responsive",
    },
    columnsDesktop: {
        type: ControlType.Number,
        title: "Desktop",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 4,
        hidden: (p) => p.columnsMode !== "responsive",
    },
    columnsWide: {
        type: ControlType.Number,
        title: "Wide",
        min: 1,
        max: 12,
        step: 1,
        defaultValue: 5,
        hidden: (p) => p.columnsMode !== "responsive",
    },

    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 100, step: 1, defaultValue: 16 },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 60, step: 1, defaultValue: 14 },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill", "scale-down"],
        optionTitles: ["Cover", "Contain", "Fill", "Scale-down"],
        defaultValue: "cover",
    },

    showCaptions: { type: ControlType.Boolean, title: "Captions", defaultValue: false },
    captionColor: {
        type: ControlType.Color,
        title: "Cap color",
        defaultValue: "rgba(255,255,255,0.85)",
        hidden: (p) => !p.showCaptions,
    },
    captionSize: {
        type: ControlType.Number,
        title: "Cap size",
        min: 10,
        max: 24,
        step: 1,
        defaultValue: 12,
        hidden: (p) => !p.showCaptions,
    },

    hoverScale: { type: ControlType.Number, title: "Hover zoom", min: 1, max: 1.2, step: 0.01, defaultValue: 1.02 },
    hoverDuration: {
        type: ControlType.Number,
        title: "Hover animation (s)",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.18,
    },

    revealOnScroll: { type: ControlType.Boolean, title: "Reveal", defaultValue: true },
    revealDuration: {
        type: ControlType.Number,
        title: "Reveal s",
        min: 0.05,
        max: 1.5,
        step: 0.01,
        defaultValue: 0.38,
        hidden: (p) => !p.revealOnScroll,
    },
    revealScaleFrom: {
        type: ControlType.Number,
        title: "Reveal from",
        min: 0.9,
        max: 1,
        step: 0.01,
        defaultValue: 0.98,
        hidden: (p) => !p.revealOnScroll,
    },
    revealOnce: { type: ControlType.Boolean, title: "Reveal once", defaultValue: true, hidden: (p) => !p.revealOnScroll },

    enableLightbox: { type: ControlType.Boolean, title: "Lightbox", defaultValue: true },
    lightboxBackground: {
        type: ControlType.Color,
        title: "LB bg",
        defaultValue: "rgba(0,0,0,0.86)",
        hidden: (p) => !p.enableLightbox,
    },
    lightboxPadding: {
        type: ControlType.Number,
        title: "LB pad",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 28,
        hidden: (p) => !p.enableLightbox,
    },
    lightboxRadius: {
        type: ControlType.Number,
        title: "LB radius",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 16,
        hidden: (p) => !p.enableLightbox,
    },
    showArrows: { type: ControlType.Boolean, title: "Arrows", defaultValue: true, hidden: (p) => !p.enableLightbox },
    showCounter: { type: ControlType.Boolean, title: "Counter", defaultValue: true, hidden: (p) => !p.enableLightbox },
    counterColor: {
        type: ControlType.Color,
        title: "Count col",
        defaultValue: "rgba(255,255,255,0.85)",
        hidden: (p) => !p.enableLightbox || !p.showCounter,
    },
    preloadNeighbor: { type: ControlType.Boolean, title: "Preload", defaultValue: true, hidden: (p) => !p.enableLightbox },

    enableParallax: { type: ControlType.Boolean, title: "Parallax", defaultValue: false },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1,
        hidden: (p) => !p.enableParallax,
    },
})

