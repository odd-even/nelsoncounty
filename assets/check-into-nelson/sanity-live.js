(function () {
  var PROJECT_ID = window.CHECKIN_SANITY_PROJECT_ID || ''
  var DATASET = window.CHECKIN_SANITY_DATASET || 'production'
  var API = '2024-10-01'

  function splitPromo(code) {
    var raw = String(code || 'CHECKINTONELSON').replace(/\s+/g, '').toUpperCase()
    if (raw.indexOf('CHECKIN') === 0 && raw.indexOf('NELSON') === raw.length - 6) {
      return {checkin: 'CHECKIN', to: 'TO', nelson: 'NELSON', raw: raw}
    }
    return {checkin: raw, to: '', nelson: '', raw: raw}
  }

  function promoHtml(code) {
    var parts = splitPromo(code)
    return (
      '<span class="cin-checkin">' + parts.checkin + '</span>' +
      (parts.to ? '<span class="cin-to">' + parts.to + '</span>' : '') +
      (parts.nelson ? '<span class="cin-nelson">' + parts.nelson + '</span>' : '')
    )
  }

  function applyPromo(code) {
    document.querySelectorAll('.code-green, .promo-code__value').forEach(function (el) {
      el.innerHTML = promoHtml(code)
    })
    document.querySelectorAll('[data-promo-copy]').forEach(function (el) {
      el.setAttribute('data-promo-copy', splitPromo(code).raw)
    })
  }

  function setText(sel, value) {
    if (value == null || value === '') return
    document.querySelectorAll(sel).forEach(function (el) { el.textContent = value })
  }

  function setHtml(sel, value) {
    if (value == null || value === '') return
    document.querySelectorAll(sel).forEach(function (el) { el.innerHTML = value })
  }

  function setCta(sel, cta) {
    if (!cta || !cta.label) return
    document.querySelectorAll(sel).forEach(function (el) {
      el.textContent = cta.label
      if (cta.href) el.setAttribute('href', cta.href)
    })
  }

  function withCode(text, code) {
    if (!text) return text
    return String(text).replace(/\{code\}/g, '')
  }

  function imageSrc(item) {
    if (!item) return ''
    if (item.imageUrl) return item.imageUrl
    if (item.image && item.image.asset && item.image.asset.url) return item.image.asset.url
    return ''
  }

  function applyCampaign(data) {
    if (!data) return
    if (data.accentColor) {
      document.documentElement.style.setProperty('--hero-accent', data.accentColor)
    }
    if (data.seoTitle) document.title = data.seoTitle
    var desc = document.querySelector('meta[name="description"]')
    if (desc && data.seoDescription) desc.setAttribute('content', data.seoDescription)

    applyPromo(data.promoCode)

    var swaps = document.querySelectorAll('.hero__campaign .hero__swap')
    if (swaps[0]) {
      if (data.heroPhrase1Line1) swaps[0].setAttribute('data-line1', data.heroPhrase1Line1)
      if (data.heroPhrase1Line2) swaps[0].setAttribute('data-line2', data.heroPhrase1Line2)
    }
    if (swaps[1]) {
      if (data.heroPhrase2Line1) swaps[1].setAttribute('data-line1', data.heroPhrase2Line1)
      if (data.heroPhrase2Line2) swaps[1].setAttribute('data-line2', data.heroPhrase2Line2)
    }
    if (typeof window.initHeroTitleSwap === 'function') window.initHeroTitleSwap(true)

    setText('.hero__lede', data.heroLede)
    setCta('.hero__main .btn--light', data.heroPrimaryCta)
    setCta('.hero__main .btn--ghost', data.heroSecondaryCta)
    setText('.hero__promo-label', data.heroPromoLabel)
    if (data.heroPromoCopy) setText('.hero__promo-copy', data.heroPromoCopy)
    if (data.heroPromoTitle) {
      var title = document.querySelector('.hero__promo-title')
      if (title) {
        title.innerHTML = 'Save with <span class="code-green">' + promoHtml(data.promoCode) + '</span>'
      }
    }

    if (data.heroSlides && data.heroSlides.length) {
      data.heroSlides.forEach(function (slide, i) {
        var img = document.querySelectorAll('.hero__slide img')[i]
        var src = imageSrc(slide)
        if (img && src) img.src = src
        var dot = document.querySelectorAll('.hero__dot')[i]
        if (dot && slide.label) dot.setAttribute('aria-label', slide.label)
      })
    }

    setText('.partner-strip__label', data.partnersStripLabel)
    setText('#about .eyebrow', data.introEyebrow)
    setText('#about .section-title', data.introTitle)
    setText('#about .section-copy', data.introCopy)
    setText('#about .intro__aside', data.introAside)

    setText('#stay .eyebrow', data.staysEyebrow)
    setText('#stay-title', data.staysTitle)
    if (data.staysCopy) setText('#stay .section-copy', data.staysCopy.replace('{code}', '').trim())

    if (data.stays) {
      data.stays.forEach(function (stay) {
        var card = document.getElementById('feature-' + stay.key) ||
          document.querySelector('[data-partner="' + stay.key + '"]')
        if (!card && stay.key === 'farmhouse') card = document.getElementById('feature-farmhouse')
        if (!card && stay.key === 'devils-backbone-camp') card = document.getElementById('feature-devils-backbone-camp')
        if (!card) return
        if (stay.name) {
          var name = card.querySelector('.stay-card__title')
          if (name) name.textContent = stay.name
        }
        if (stay.copy) {
          var copy = card.querySelector('.stay-card__copy')
          if (copy) copy.textContent = stay.copy
        }
        var src = imageSrc(stay)
        var img = card.querySelector('img')
        if (img && src) img.src = src
        if (stay.cta) {
          var btn = card.querySelector('.btn--dark')
          if (btn) {
            btn.textContent = stay.cta.label
            if (stay.cta.href) btn.setAttribute('href', stay.cta.href)
          }
        }
      })
    }

    setText('#experience .eyebrow', data.experienceEyebrow)
    setText('#experience-title', data.experienceTitle)
    setText('#experience .showcase__head .section-copy', data.experienceCopy)

    if (data.partners) {
      var featureMap = {
        'flying-fox': 'feature-flying-fox',
        'glass-hollow': 'feature-glass-hollow',
        tunnel: 'feature-tunnel',
        'devils-backbone': 'feature-devils-backbone',
        rides: 'feature-rides',
      }
      data.partners.forEach(function (partner) {
        var card = document.getElementById(featureMap[partner.key] || '')
        if (!card) return
        if (partner.role) setNode(card, '.partner-feature__role', partner.role)
        if (partner.name) setNode(card, '.partner-feature__title', partner.name)
        if (partner.copy) setNode(card, '.partner-feature__copy', partner.copy)
        if (partner.badge) setNode(card, '.partner-feature__badge', partner.badge)
        var src = imageSrc(partner)
        var img = card.querySelector('img')
        if (img && src) img.src = src
        if (partner.cta) {
          var primary = card.querySelector('.btn--dark')
          if (primary) {
            primary.textContent = partner.cta.label
            if (partner.cta.href) primary.setAttribute('href', partner.cta.href)
          }
        }
        if (partner.secondaryCta) {
          var secondary = card.querySelector('.btn--outline')
          if (secondary) {
            secondary.textContent = partner.secondaryCta.label
            if (partner.secondaryCta.href) secondary.setAttribute('href', partner.secondaryCta.href)
          }
        }
      })
    }

    setText('#itinerary .eyebrow', data.itineraryEyebrow)
    setText('#itin-title', data.itineraryTitle)
    setText('#itinerary .itinerary__head .section-copy', data.itineraryCopy)

    setText('#passport .eyebrow', data.passportEyebrow)
    setText('#passport-title', data.passportTitle)
    setText('#passport .section-copy', data.passportCopy)
    if (data.passportNote) {
      var note = document.querySelector('.passport__note')
      if (note) {
        var first = data.passportNote
        note.childNodes.forEach(function (node) {
          if (node.nodeType === 3 && node.textContent.trim()) {
            node.textContent = first + ' '
          }
        })
      }
    }
    if (data.passportUrl) {
      window.LOYALBREW_PASSPORT_URL = data.passportUrl
      document.querySelectorAll('#openPassport, .passport-card__footer .btn--dark').forEach(function (el) {
        el.setAttribute('href', data.passportUrl)
      })
    }
    setCta('#openPassport', data.passportPrimaryCta)
    setCta('.passport__actions .btn--outline', data.passportSecondaryCta)
    if (data.passportSteps) {
      var steps = document.querySelectorAll('.passport__step')
      data.passportSteps.forEach(function (step, i) {
        if (!steps[i]) return
        if (step.title) {
          var h = steps[i].querySelector('h3')
          if (h) h.textContent = step.title
        }
        if (step.copy) {
          var p = steps[i].querySelector('p')
          if (p) p.textContent = step.copy.replace('{code}', 'CHECKINTONELSON')
        }
      })
    }

    setText('#promo .eyebrow', data.offersEyebrow)
    setText('#promo .section-copy', data.offersCopy)
    if (data.offerPerks && data.offerPerks.length) {
      var list = document.querySelector('.promo-perks')
      if (list) {
        list.innerHTML = data.offerPerks.map(function (item) {
          return '<li>' + escapeHtml(item) + '</li>'
        }).join('')
      }
    }

    setText('#book .eyebrow', data.closingEyebrow)
    setText('#book .section-title', data.closingTitle)
    if (data.closingCopy) setText('#book .section-copy', data.closingCopy.replace('{code}', '').trim())
    setCta('#book .btn--dark', data.closingPrimaryCta)
    setCta('#book .btn--outline', data.closingSecondaryCta)

    if (data.footerTitle) setText('.nc-footer-campaign strong', data.footerTitle)
    if (data.footerCopy) {
      var footerPs = document.querySelectorAll('.nc-footer-campaign p')
      if (footerPs[0]) footerPs[0].textContent = data.footerCopy
    }
  }

  function setNode(root, sel, value) {
    var el = root.querySelector(sel)
    if (el && value) el.textContent = value
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function query() {
    return encodeURIComponent('*[_id == "campaign"][0]{...,heroSlides[]{label,imageUrl,"image":{asset->{url}}},stays[]{...,"image":{asset->{url}}},partners[]{...,"image":{asset->{url}}}}')
  }

  if (!PROJECT_ID || PROJECT_ID === 'cinelson') return

  fetch('https://' + PROJECT_ID + '.api.sanity.io/v' + API + '/data/query/' + DATASET + '?query=' + query())
    .then(function (res) { return res.ok ? res.json() : null })
    .then(function (json) {
      if (json && json.result) applyCampaign(json.result)
    })
    .catch(function () {})
})()
