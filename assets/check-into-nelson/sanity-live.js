(function () {
  var PROJECT_ID = window.CHECKIN_SANITY_PROJECT_ID || 'ccbigluo'
  var DATASET = window.CHECKIN_SANITY_DATASET || 'production'
  var DOC_ID = 'campaign'
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
    if (item.asset && item.asset.url) return item.asset.url
    return ''
  }

  function paintImg(img, src, alt) {
    if (!img || !src) return
    img.setAttribute('src', src)
    img.setAttribute('data-src', src)
    img.removeAttribute('srcset')
    img.removeAttribute('data-srcset')
    img.dataset.hydrated = '1'
    if (alt) img.alt = alt
  }

  function paintGallery(root, images, fallbackSrc, fallbackAlt) {
    if (!root) return
    var imgs = root.querySelectorAll('.media-carousel__track img, .hero__slide img')
    if (!imgs.length) imgs = root.querySelectorAll('img')
    if (images && images.length) {
      images.forEach(function (shot, i) {
        if (imgs[i]) paintImg(imgs[i], imageSrc(shot), shot.alt)
      })
      return
    }
    if (fallbackSrc && imgs[0]) paintImg(imgs[0], fallbackSrc, fallbackAlt)
  }

  function itemPath(listName, item, index) {
    if (item && item._key) return listName + '[_key=="' + item._key + '"]'
    return listName + '[' + index + ']'
  }

  function mark(el, path) {
    if (!el || !path || el.getAttribute('data-sanity')) return
    el.setAttribute('data-sanity', 'id=' + DOC_ID + ';type=campaign;path=' + path)
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
        paintImg(img, imageSrc(slide), slide.label)
        mark(img, itemPath('heroSlides', slide, i) + '.image')
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
        if (stay.offerNote) {
          var offer = card.querySelector('.stay-card__offer')
          if (offer) {
            offer.innerHTML = escapeHtml(stay.offerNote).replace(
              /\{code\}/g,
              '<span class="code-green">' + promoHtml(data.promoCode) + '</span>'
            )
          }
        }
        if (stay.badge) setNode(card, '.stay-card__badge', stay.badge)
        paintGallery(card, stay.gallery, imageSrc(stay), stay.name)
        var stayPath = itemPath('stays', stay, data.stays.indexOf(stay))
        mark(card.querySelector('.stay-card__title'), stayPath + '.name')
        mark(card.querySelector('.stay-card__copy'), stayPath + '.copy')
        mark(card.querySelector('.stay-card__offer'), stayPath + '.offerNote')
        mark(card.querySelector('.stay-card__badge'), stayPath + '.badge')
        card.querySelectorAll('.media-carousel__track img').forEach(function (img, n) {
          var shot = stay.gallery && stay.gallery[n]
          mark(img, shot ? itemPath(stayPath + '.gallery', shot, n) + '.image' : stayPath + '.image')
        })
        if (stay.cta) {
          var btn = card.querySelector('.btn--dark')
          if (btn) {
            var discount = stay.badge
              ? ' <span class="btn__discount">' + escapeHtml(stay.badge) + '</span>'
              : ''
            btn.innerHTML = escapeHtml(stay.cta.label) + discount
            if (stay.cta.href) btn.setAttribute('href', stay.cta.href)
            mark(btn, stayPath + '.cta.label')
          }
        }
      })
    }

    applyPlaceCards('.do-card', data.introCards, 'introCards')
    applyPlaceCards('.partner-chip', data.partnerChips, 'partnerChips')
    applyPlaceCards('.highlights-grid__item', data.highlights, 'highlights')
    setText('#highlights-title', data.highlightsTitle)
    setCta('#highlights .highlights__actions .btn', data.highlightsCta)

    setText('#experience .eyebrow', data.experienceEyebrow)
    setText('#experience-title', data.experienceTitle)
    setText('#experience .showcase__head .section-copy', data.experienceCopy)

    if (data.partners) {
      var featureMap = {
        'flying-fox': 'feature-flying-fox',
        'glass-hollow': 'feature-glass-hollow',
        tunnel: 'feature-tunnel',
        'blue-ridge-tunnel': 'feature-tunnel',
        wintergreen: 'feature-wintergreen',
        'nelson-29': 'feature-nelson-29',
        'devils-backbone': 'feature-devils-backbone',
        rides: 'feature-rides',
        'reliable-rides': 'feature-rides',
      }
      data.partners.forEach(function (partner) {
        var card = document.getElementById(featureMap[partner.key] || '')
        if (!card) return
        if (partner.role) setNode(card, '.partner-feature__role', partner.role)
        if (partner.name) setNode(card, '.partner-feature__title', partner.name)
        if (partner.copy) setNode(card, '.partner-feature__copy', partner.copy)
        if (partner.badge) setNode(card, '.partner-feature__badge', partner.badge)
        if (partner.offerNote) {
          var meta = card.querySelector('.partner-feature__meta div')
          if (meta) {
            meta.innerHTML = '<span class="code-green">' + promoHtml(data.promoCode) + '</span> <span>· ' + escapeHtml(partner.offerNote) + '</span>'
          }
        }
        paintGallery(card, partner.gallery, imageSrc(partner), partner.name)
        var partnerPath = itemPath('partners', partner, data.partners.indexOf(partner))
        mark(card.querySelector('.partner-feature__role'), partnerPath + '.role')
        mark(card.querySelector('.partner-feature__title'), partnerPath + '.name')
        mark(card.querySelector('.partner-feature__copy'), partnerPath + '.copy')
        mark(card.querySelector('.partner-feature__badge'), partnerPath + '.badge')
        card.querySelectorAll('.media-carousel__track img').forEach(function (img, n) {
          var shot = partner.gallery && partner.gallery[n]
          mark(img, shot ? itemPath(partnerPath + '.gallery', shot, n) + '.image' : partnerPath + '.image')
        })
        if (partner.cta) {
          var primary = card.querySelector('.btn--dark')
          if (primary) {
            primary.textContent = partner.cta.label
            if (partner.cta.href) primary.setAttribute('href', partner.cta.href)
            mark(primary, partnerPath + '.cta.label')
          }
        }
        if (partner.secondaryCta) {
          var secondary = card.querySelector('.btn--outline')
          if (secondary) {
            secondary.textContent = partner.secondaryCta.label
            if (partner.secondaryCta.href) secondary.setAttribute('href', partner.secondaryCta.href)
            mark(secondary, partnerPath + '.secondaryCta.label')
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
          if (p) p.textContent = step.copy.replace('{code}', splitPromo(data.promoCode).raw)
        }
        mark(steps[i].querySelector('h3'), itemPath('passportSteps', step, i) + '.title')
        mark(steps[i].querySelector('p'), itemPath('passportSteps', step, i) + '.copy')
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
    var footerPs = document.querySelectorAll('.nc-footer-campaign p')
    if (data.footerCopy && footerPs[0]) footerPs[0].textContent = data.footerCopy
    if (data.footerPromoNote && footerPs[1]) {
      footerPs[1].innerHTML = escapeHtml(data.footerPromoNote).replace(
        /\{code\}/g,
        '<span class="code-green">' + promoHtml(data.promoCode) + '</span>'
      )
    }
    markFields(data)
  }

  function applyPlaceCards(selector, items, listName) {
    if (!items || !items.length) return
    var nodes = Array.prototype.slice.call(document.querySelectorAll(selector))
    nodes.forEach(function (node, i) {
      var item = items[i % items.length]
      if (!item) return
      var path = itemPath(listName, item, i % items.length)
      var title = node.querySelector('.do-card__title, .highlights-grid__name')
      if (item.name && title) title.textContent = item.name
      if (item.name && node.classList.contains('partner-chip')) {
        Array.prototype.forEach.call(node.childNodes, function (child) {
          if (child.nodeType === 3 && child.textContent.trim()) child.textContent = ' ' + item.name + ' '
        })
      }
      var copy = node.querySelector('.do-card__copy')
      if (item.copy && copy) copy.textContent = item.copy
      var label = node.querySelector('.cat-pill')
      if (item.label && label) label.textContent = item.label
      if (item.href && node.tagName === 'A') node.setAttribute('href', item.href)
      var img = node.querySelector('img')
      paintImg(img, imageSrc(item), item.alt || item.name)
      mark(title || node, path + '.name')
      mark(copy, path + '.copy')
      mark(img, path + '.image')
    })
  }

  function markFields() {
    mark(document.querySelector('.hero__lede'), 'heroLede')
    var swaps = document.querySelectorAll('.hero__campaign .hero__swap')
    mark(swaps[0], 'heroPhrase1Line1')
    mark(swaps[1], 'heroPhrase2Line1')
    mark(document.querySelector('.hero__main .btn--light'), 'heroPrimaryCta.label')
    mark(document.querySelector('.hero__main .btn--ghost'), 'heroSecondaryCta.label')
    mark(document.querySelector('.hero__promo-copy'), 'heroPromoCopy')
    mark(document.querySelector('.partner-strip__label'), 'partnersStripLabel')
    mark(document.querySelector('#about .section-title'), 'introTitle')
    mark(document.querySelector('#introCopy'), 'introCopy')
    mark(document.querySelector('#about .intro__aside'), 'introAside')
    mark(document.querySelector('#stay .eyebrow'), 'staysEyebrow')
    mark(document.querySelector('#stay-title'), 'staysTitle')
    mark(document.querySelector('#stay .section-copy'), 'staysCopy')
    mark(document.querySelector('#experience-title'), 'experienceTitle')
    mark(document.querySelector('#experience .showcase__head .section-copy'), 'experienceCopy')
    mark(document.querySelector('#itin-title'), 'itineraryTitle')
    mark(document.querySelector('#itinerary .itinerary__head .section-copy'), 'itineraryCopy')
    mark(document.querySelector('#highlights-title'), 'highlightsTitle')
    mark(document.querySelector('#highlights .highlights__actions .btn'), 'highlightsCta.label')
    mark(document.querySelector('#passport .eyebrow'), 'passportEyebrow')
    mark(document.querySelector('#passport-title'), 'passportTitle')
    mark(document.querySelector('#passport .section-copy'), 'passportCopy')
    mark(document.querySelector('#openPassport'), 'passportPrimaryCta.label')
    mark(document.querySelector('.passport__note'), 'passportNote')
    mark(document.querySelector('.nc-footer-campaign strong'), 'footerTitle')
    var footerPs = document.querySelectorAll('.nc-footer-campaign p')
    mark(footerPs[0], 'footerCopy')
    mark(footerPs[1], 'footerPromoNote')
    document.querySelectorAll('.hero__slide img').forEach(function (img, i) {
      mark(img, 'heroSlides[' + i + '].image')
    })
    document.querySelectorAll('#stay .stay-card').forEach(function (card, i) {
      mark(card.querySelector('.stay-card__title'), 'stays[' + i + '].name')
      mark(card.querySelector('.stay-card__copy'), 'stays[' + i + '].copy')
      mark(card.querySelector('.stay-card__offer'), 'stays[' + i + '].offerNote')
      mark(card.querySelector('.stay-card__badge'), 'stays[' + i + '].badge')
      mark(card.querySelector('.btn--dark'), 'stays[' + i + '].cta.label')
      card.querySelectorAll('.media-carousel__track img').forEach(function (img, n) {
        mark(img, 'stays[' + i + '].gallery[' + n + '].image')
      })
    })
    document.querySelectorAll('#experience .partner-feature').forEach(function (card, i) {
      mark(card.querySelector('.partner-feature__role'), 'partners[' + i + '].role')
      mark(card.querySelector('.partner-feature__title'), 'partners[' + i + '].name')
      mark(card.querySelector('.partner-feature__copy'), 'partners[' + i + '].copy')
      mark(card.querySelector('.partner-feature__badge'), 'partners[' + i + '].badge')
      mark(card.querySelector('.btn--dark'), 'partners[' + i + '].cta.label')
      card.querySelectorAll('.media-carousel__track img').forEach(function (img, n) {
        mark(img, 'partners[' + i + '].gallery[' + n + '].image')
      })
    })
    document.querySelectorAll('#doRailTrack > .do-card').forEach(function (card, i) {
      mark(card.querySelector('.do-card__title'), 'introCards[' + i + '].name')
      mark(card.querySelector('.do-card__copy'), 'introCards[' + i + '].copy')
      mark(card.querySelector('.cat-pill'), 'introCards[' + i + '].label')
      mark(card.querySelector('img'), 'introCards[' + i + '].image')
    })
    document.querySelectorAll('#partnerStripRow > .partner-chip').forEach(function (chip, i) {
      mark(chip, 'partnerChips[' + i + '].name')
      mark(chip.querySelector('img'), 'partnerChips[' + i + '].image')
    })
    document.querySelectorAll('.highlights-grid__item').forEach(function (tile, i) {
      mark(tile.querySelector('.highlights-grid__name'), 'highlights[' + i + '].name')
      mark(tile.querySelector('img'), 'highlights[' + i + '].image')
    })
    document.querySelectorAll('.passport__step').forEach(function (step, i) {
      mark(step.querySelector('h3'), 'passportSteps[' + i + '].title')
      mark(step.querySelector('p'), 'passportSteps[' + i + '].copy')
    })
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
    var projection = [
      '...',
      'heroSlides[]{_key,label,imageUrl,image{asset->{url}}}',
      'stays[]{_key,key,name,copy,offerNote,badge,imageUrl,image{asset->{url}},gallery[]{_key,alt,imageUrl,image{asset->{url}}},cta}',
      'partners[]{_key,key,name,role,badge,copy,offerNote,category,showInStrip,imageUrl,image{asset->{url}},gallery[]{_key,alt,imageUrl,image{asset->{url}}},cta,secondaryCta}',
      'introCards[]{_key,name,label,copy,href,alt,imageUrl,image{asset->{url}}}',
      'partnerChips[]{_key,name,label,href,alt,imageUrl,image{asset->{url}}}',
      'highlights[]{_key,name,label,copy,href,alt,imageUrl,image{asset->{url}}}',
      'passportSteps[]{_key,title,copy}',
    ].join(',')
    return encodeURIComponent('*[_id == "campaign"][0]{' + projection + '}')
  }

  function loadCampaign() {
    return fetch('/api/campaign')
      .then(function (res) { return res.ok ? res.json() : null })
      .then(function (json) {
        if (json && json.result) return json
        return fetch('https://' + PROJECT_ID + '.api.sanity.io/v' + API + '/data/query/' + DATASET + '?query=' + query())
          .then(function (res) { return res.ok ? res.json() : null })
      })
  }

  if (!PROJECT_ID) return

  loadCampaign()
    .then(function (json) {
      if (json && json.result) applyCampaign(json.result)
      else markFields()
    })
    .catch(function () {
      markFields()
    })
})()
