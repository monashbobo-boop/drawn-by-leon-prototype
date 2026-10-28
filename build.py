"""Builds the homepage v2 prototype from the 16 Oct preview export (scratchpad/old).

Every change is written as the markup WordPress core blocks produce, so it can move
into the theme as-is: Navigation block (with a Submenu for Book Leon), Columns/Column,
Image, Heading, Paragraph, List and Buttons.
"""
import re
import sys

OLD = sys.argv[1]
I = 'wp-content/themes/artist-portfolio/assets/images/'

PAGES = {
    'index.html': 'home',
    'events.html': 'events',
    'custom-portraits.html': 'portraits',
    'portfolio.html': 'portfolio',
    'about.html': 'about',
    'contact.html': 'book',
}

CARET = ('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" '
         'aria-hidden="true" focusable="false"><path d="M1.50002 4L6.00002 8L10.5 4" stroke-width="1.5"></path></svg>')


def nav_items(cur):
    def link(href, label, key, extra=''):
        cls = ' current-menu-item' if key == cur else ''
        cur_attr = ' aria-current="page"' if key == cur else ''
        return (f'<li class="wp-block-navigation-item wp-block-navigation-link{extra}{cls}">'
                f'<a class="wp-block-navigation-item__content" href="{href}"{cur_attr}>'
                f'<span class="wp-block-navigation-item__label">{label}</span></a></li>')

    sub = ''.join(
        f'<li class="wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content" href="{h}">'
        f'<span class="wp-block-navigation-item__label">{l}</span></a></li>'
        for h, l in [('contact.html#event', 'Live at events'), ('contact.html#photo', 'Drawn from photos'), ('contact.html#other', 'Other inquiries')])
    book_cur = ' current-menu-item' if cur == 'book' else ''
    book = (f'<li class="wp-block-navigation-item has-child wp-block-navigation-submenu nav-book{book_cur}">'
            '<a class="wp-block-navigation-item__content" href="contact.html">Book Leon</a>'
            f'<button aria-label="Book Leon submenu" class="wp-block-navigation__submenu-icon wp-block-navigation-submenu__toggle" aria-expanded="false">{CARET}</button>'
            f'<ul class="wp-block-navigation__submenu-container wp-block-navigation-submenu">{sub}</ul></li>')
    return (link('index.html', 'Home', 'home', ' nav-home')
            + link('events.html', 'Live at events', 'events')
            + link('custom-portraits.html', 'Custom portraits', 'portraits')
            + link('portfolio.html', 'Portfolio', 'portfolio')
            + link('about.html', 'About', 'about')
            + book)


def swap_header(s, cur):
    h0 = s.index('<header class="wp-block-template-part">')
    h1 = s.index('</header>', h0)
    head = s[h0:h1]
    ul0 = head.index('<ul class="wp-block-navigation__container')
    ul0 = head.index('>', ul0) + 1
    soc = head.index('<li class="wp-block-navigation-item">', ul0)  # the social links item stays
    head = head[:ul0] + nav_items(cur) + head[soc:]
    head = head.replace('class="wp-block-group alignfull site-header ', 'class="wp-block-group alignfull site-header has-open-menu ', 1)
    return s[:h0] + head + s[h1:]


def base(name):
    s = open(f'{OLD}/{name}').read()
    return s[s.index('<!DOCTYPE html>'):]


def finish(s, name, title):
    s = swap_header(s, PAGES[name])
    f = s.index('<footer')
    s = s[:f] + s[f:].replace('<a href="contact.html">Contact</a>', '<a href="contact.html">Book Leon</a>')
    s = s.replace('wp-content/themes/artist-portfolio/assets/js/site.js', 'js/site.js')
    s = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', s, count=1, flags=re.S)
    s = s.replace('<base target="_self">', '')
    m = re.search(r"<link[^>]*href='wp-content/themes/artist-portfolio/assets/css/theme\.css[^>]*>", s)
    s = s[:m.end()] + '\n<link rel="stylesheet" href="proto.css">' + s[m.end():]
    s = s.replace('</body>', '<script src="proto.js" defer></script>\n</body>', 1)
    if name == 'index.html':
        # The artifact viewer wraps the home page in its own skeleton; GitHub Pages serves it as is.
        pass
    return s


def section_bounds(s, marker):
    i = s.index(marker)
    return s.rindex('<div class="wp-block-group alignfull', 0, i + len(marker))


LETTERS = 'c1 a1 r1 i c2 a2 t u r2 e s'.split()


def letters_gallery():
    figs = ''.join(
        f'<figure class="wp-block-image size-full"><img decoding="async" src="{I}letters/letter-{k + 1:02d}-{n}.webp" alt="{"Caricatures" if k == 0 else ""}"/></figure>'
        for k, n in enumerate(LETTERS))
    return ('<figure class="wp-block-gallery has-nested-images columns-default is-style-face-letters '
            f'wp-block-gallery-is-layout-flex">{figs}</figure>\n\n')


def fade_gallery(cls, items):
    figs = ''.join(
        f'<figure class="wp-block-image size-large"><img decoding="async" src="{I}{src}" alt="{alt}"/>'
        + (f'<figcaption class="wp-element-caption">{cap}</figcaption>' if cap else '') + '</figure>'
        for src, alt, cap in items)
    return (f'<figure class="wp-block-gallery has-nested-images columns-default is-style-crossfade {cls} '
            f'wp-block-gallery-is-layout-flex">{figs}</figure>\n\n')


HERO_FADE = fade_gallery('hero-fade', [
    ('photos/hero-frame-1.webp', 'Guests at markets and festivals holding up the caricatures Leon just drew of them', ''),
    ('photos/hero-frame-2.webp', 'More happy guests with their caricatures at Leon\'s stall', ''),
    ('photos/hero-frame-3.webp', 'Couples and friends showing off their caricatures', ''),
])

EVENT_PHOTO = (f'<figure class="wp-block-image size-large two-ways__media"><img decoding="async" src="{I}photos/event-birthday.webp" '
               'alt="Leon drawing a child at a birthday party while the other kids watch"/></figure>\n\n')

COLLAGE_ITEMS = [
    ('works/from-photos/from-photos-02.webp', 'Colour caricature of a woman hugging her dog'),
    ('works/from-photos/from-photos-13.webp', 'Colour caricature of three mates holding drinks'),
    ('works/from-photos/from-photos-12.webp', 'Colour caricature of a man with his dog'),
    ('works/from-photos/from-photos-17.webp', 'Colour caricature of a boy holding his cat'),
    ('works/from-photos/from-photos-09.webp', 'Colour caricature of a man riding a motorbike at Red Rock'),
]
COLLAGE = ('<figure class="wp-block-gallery has-nested-images columns-default is-style-collage two-ways__media '
           'wp-block-gallery-is-layout-flex">'
           + ''.join(f'<figure class="wp-block-image size-large"><img decoding="async" src="{I}{src}" alt="{alt}"/></figure>' for src, alt in COLLAGE_ITEMS)
           + '</figure>\n\n')


def head_row(title, href):
    return ('<div class="wp-block-group two-ways__head is-content-justification-space-between is-nowrap is-layout-flex wp-block-group-is-layout-flex">\n'
            f'<h3 class="wp-block-heading two-ways__title">{title}</h3>\n'
            '<div class="wp-block-buttons is-layout-flex wp-block-buttons-is-layout-flex">'
            f'<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="{href}">Explore more</a></div></div>\n'
            '</div>\n\n')


TWO_WAYS = ('''<div class="wp-block-group alignfull two-ways has-global-padding is-layout-constrained wp-block-group-is-layout-constrained" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">
<p class="has-text-align-center hand-note is-small has-navy-soft-color has-text-color">pick the one that suits you</p>

<h2 class="wp-block-heading has-text-align-center has-xx-large-font-size">Two ways to get drawn</h2>

<div class="wp-block-columns alignfull two-ways__grid is-layout-flex wp-block-columns-is-layout-flex">
<div class="wp-block-column two-ways__card has-navy-color has-yellow-background-color has-text-color has-background is-layout-flow wp-block-column-is-layout-flow">
''' + EVENT_PHOTO + head_row('Live at events', 'events.html') + '''<p class="two-ways__text">I draw your guests on the spot at weddings, parties, work and community events. They sit, laugh, watch it come together and take the original home.</p>

<p class="two-ways__facts">A4 on paper &middot; Black &amp; white or colour &middot; From 2 hours</p>
</div>

<div class="wp-block-column two-ways__card has-white-color has-navy-background-color has-text-color has-background is-layout-flow wp-block-column-is-layout-flow">
''' + COLLAGE + head_row('Drawn from photos', 'custom-portraits.html') + '''<p class="two-ways__text">Send me your favourite photos and I&#8217;ll turn them into a hand-drawn caricature. A personal gift for birthdays, weddings and anniversaries, or just for you.</p>

<p class="two-ways__facts">A3 original or digital file &middot; Black &amp; white or colour &middot; Ready in about 5 business days</p>
</div>
</div>
</div>

''')


def build_home():
    s = base('index.html')
    hero = s.index('<div class="wp-block-cover alignfull is-dark')
    tag = s.index('<div class="wp-block-group alignfull tag-strip')
    face = s.index('<div class="wp-block-group alignfull face-here')
    about = s.index('<div class="wp-block-group alignfull is-style-panel has-mascot')
    ways = section_bounds(s, 'two ways to get drawn!')
    quick = section_bounds(s, 'yours to keep!')
    recent = section_bounds(s, 'fresh off the sketchpad')
    kind = s.index('<div class="wp-block-group alignfull testimonials')
    end = s.index('</div></main>')
    cuts = sorted([hero, tag, face, about, ways, quick, recent, kind, end])

    def part(i):
        return s[i:cuts[cuts.index(i) + 1]]

    h = part(hero)
    # The face letters sit under "hi, I'm Leon!"; the photos behind crossfade instead of scrolling.
    h = h.replace('<h1 class="wp-block-heading photo-hero__title', letters_gallery() + '<h1 class="wp-block-heading photo-hero__title', 1)
    inner = h.index('wp-block-cover__inner-container')
    inner = h.index('>', inner) + 1
    h = h[:inner] + '\n' + HERO_FADE + h[inner:]
    h = re.sub(r'<div class="wp-block-buttons is-layout-flex[^"]*"[^>]*>.*?</div>\s*</div>\s*(?=</div></div>)', '', h, count=1, flags=re.S)
    assert 'Live at your event</a>' not in h

    # Leon's order (27 Oct): "Every guest goes home smiling" is gone, the colour-in game closes the page.
    order = [h, part(tag), TWO_WAYS, part(about), part(recent), part(kind), part(face)]
    s = s[:hero] + ''.join(order) + s[end:]
    return finish(s, 'index.html', 'Drawn by Leon Home v2')


def build_contact():
    s = base('contact.html')
    s = s.replace('<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#photo">Drawn from my photo</a></div>',
                  '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#photo">Drawn from my photo</a></div>\n'
                  '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#other">Something else</a></div>', 1)
    s = s.replace('<option>2 hours</option><option>3 hours</option><option>4 hours</option><option>Not sure yet</option>',
                  '<option>2 hours</option><option>3 hours</option><option>4 hours</option><option>5 hours</option><option>6 hours</option><option>Not sure yet</option>', 1)
    old_ta = 'Tell me about the people and the occasion. After you send this, reply to my email with clear photos of each face.'
    up = (f'<div class="p-upload grunion-field-wrap"><label class="grunion-field-label" for="up-photos">Photos of each face (optional, up to 3)</label>'
          f'<label class="p-upload__drop" for="up-photos"><img src="{I}doodles/icons/leon-photo-upload.webp" alt=""><strong>Drop photos here or tap to choose</strong>'
          '<small>JPEG or PNG, up to 20 MB each</small></label><input id="up-photos" type="file" accept="image/jpeg,image/png" multiple>'
          '<ul class="p-upload__list" aria-live="polite"></ul><p class="p-upload__warn" hidden>Only the first 3 photos will be sent. Email me any extras.</p></div>\n')
    i = s.rindex('<label', 0, s.index(old_ta))
    s = s[:i] + up + s[i:]
    s = s.replace(old_ta, 'Tell me about the people and the occasion. No photos to hand? Send them when I reply.', 1)
    other = '''<div id="other" class="wp-block-group form-block is-layout-flow wp-block-group-is-layout-flow">
<p class="hand-note postcard__dear has-navy-color has-text-color">Dear Leon, I have a question&#8230;</p>
<form class="wp-block-jetpack-contact-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem" onsubmit="event.preventDefault()"><label class="grunion-field-label pv-field pv-field-text" style="display:grid;gap:.35rem;font-weight:600;font-size:.9rem;grid-column:span 1">Your name <span class="pv-req" style="color:var(--wp--preset--color--red)">*</span><input id="o-name" type="text"></label>
<label class="grunion-field-label pv-field pv-field-email" style="display:grid;gap:.35rem;font-weight:600;font-size:.9rem;grid-column:span 1">Email <span class="pv-req" style="color:var(--wp--preset--color--red)">*</span><input id="o-email" type="email"></label>
<label class="grunion-field-label pv-field pv-field-textarea" style="display:grid;gap:.35rem;font-weight:600;font-size:.9rem;grid-column:1/-1">What can I help with? <span class="pv-req" style="color:var(--wp--preset--color--red)">*</span><textarea id="o-msg" rows="5"></textarea></label>
<div class="wp-block-button" style="grid-column:1/-1"><button class="wp-block-button__link wp-element-button" type="submit">Post it to Leon</button></div></form></div>
'''
    j = s.index('<div class="wp-block-column postcard__address')
    k = s.rindex('</div>', 0, j)
    s = s[:k] + other + s[k:]
    return finish(s, 'contact.html', 'Book Leon')


out = {'index.html': build_home(), 'contact.html': build_contact()}
for name in ['events.html', 'custom-portraits.html', 'portfolio.html']:
    out[name] = finish(base(name), name, 'Drawn by Leon')


def build_about():
    s = base('about.html')
    # The last panel (Leon has drawn at) gets the wavy-bottom panel style so it nests into the footer wave.
    i = s.index('Leon has drawn at')
    j = s.rindex('<div class="wp-block-group alignfull is-style-panel ', 0, i)
    s = s[:j] + s[j:].replace('alignfull is-style-panel ', 'alignfull is-style-panel-wave ', 1)
    return finish(s, 'about.html', 'Drawn by Leon')


out['about.html'] = build_about()
for name, s in out.items():
    open(name, 'w').write(s)
    print(name, len(s))
