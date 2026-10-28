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
    'privacy.html': 'privacy',
}

# SEO title and meta description per page (the same text goes into Jetpack SEO on WordPress.com).
SEO = {
    'index.html': ('Caricature Artist Melbourne | Drawn by Leon',
                   'Hand-drawn caricatures by Leon: live caricature drawing for weddings, parties and corporate events across Melbourne, plus custom portraits drawn from your photos.'),
    'events.html': ('Live Caricatures for Weddings & Events | Drawn by Leon',
                    'Book a live caricature artist for your wedding, birthday party, corporate event or festival in Melbourne. Guests are drawn on the spot in black and white or colour.'),
    'custom-portraits.html': ('Custom Caricature Portraits from Photos | Drawn by Leon',
                              'Turn a favourite photo into a hand-drawn caricature portrait. A3 original or digital file, black and white or colour. A personal gift for birthdays, weddings and anniversaries.'),
    'portfolio.html': ('Caricature Portfolio: Live & Custom Drawings | Drawn by Leon',
                       'See Leon\'s caricatures: live drawings from weddings, parties and markets, custom portraits from photos, digital caricatures and celebrity sketches.'),
    'about.html': ('About Leon, Melbourne Caricature Artist | Drawn by Leon',
                   'Meet Leon, a former art teacher who draws detailed, charming caricatures live at events around Melbourne and as custom portraits from photos.'),
    'contact.html': ('Book a Caricature Artist in Melbourne | Drawn by Leon',
                     'Check Leon\'s availability for your wedding, party or work event, order a custom caricature portrait from your photos, or ask a question.'),
    'privacy.html': ('Privacy & Copyright | Drawn by Leon',
                     'How Drawn by Leon looks after the details and photos you send, and who owns the drawings.'),
}

JSON_LD = '''<script type="application/ld+json">
{"@context":"https://schema.org","@type":"LocalBusiness","name":"Drawn by Leon","description":"Hand-drawn caricatures, live at weddings, parties and events, or drawn from your photos.","url":"https://drawnbyleon.com/","logo":"https://drawnbyleon.com/wp-content/uploads/2026/10/drawn-by-leon-logo.webp","image":"https://drawnbyleon.com/wp-content/themes/artist-portfolio/assets/images/photos/hero-frame-1.webp","telephone":"+61466532313","email":"leon.caricature@gmail.com","areaServed":{"@type":"City","name":"Melbourne"},"address":{"@type":"PostalAddress","addressLocality":"Melbourne","addressRegion":"VIC","addressCountry":"AU"},"sameAs":["https://www.instagram.com/leon.caricature","https://www.facebook.com/leon.caricature"],"knowsAbout":["Caricature","Live caricature drawing","Wedding entertainment","Party entertainment","Custom portraits"]}
</script>'''

LEGAL = ('<p class="has-small-font-size">&copy; 2026 Drawn by Leon. All artwork is Leon&#8217;s own and may not be reused without permission. '
         '<a href="privacy.html">Privacy &amp; copyright</a></p>')

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
    seo_title, desc = SEO[name]
    s = re.sub(r'<title>.*?</title>', f'<title>{seo_title}</title>\n<meta name="description" content="{desc}" />', s, count=1, flags=re.S)
    if name == 'index.html':
        s = s.replace('</head>', JSON_LD + '\n</head>', 1)
    s = re.sub(r'<div class="wp-block-group alignwide footer-legal(.*?)>\s*<p class="has-small-font-size">.*?</p>',
               lambda m: f'<div class="wp-block-group alignwide footer-legal{m.group(1)}>\n{LEGAL}', s, count=1, flags=re.S)
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
    s = s.replace('<h1 class="wp-block-heading page-title has-giant-font-size">Say hi!</h1>',
                  '<h1 class="wp-block-heading page-title has-giant-font-size">Book Leon</h1>', 1)
    return finish(s, 'contact.html', 'Book Leon')


out = {'index.html': build_home(), 'contact.html': build_contact()}
out['portfolio.html'] = finish(base('portfolio.html'), 'portfolio.html', 'Drawn by Leon')


def swap_last_cta(s, new):
    i = s.index('<div class="wp-block-group alignfull cta-band')
    k = s.index('</div></main>', i)
    return s[:i] + new + s[k:]


EVENTS_CTA = '''<div class="wp-block-group alignfull cta-band cta-plan has-navy-color has-yellow-background-color has-text-color has-background has-global-padding is-layout-constrained wp-block-group-is-layout-constrained" style="padding-top:var(--wp--preset--spacing--70)">
<div class="wp-block-columns alignwide are-vertically-aligned-center is-layout-flex wp-block-columns-is-layout-flex">
<div class="wp-block-column is-vertically-aligned-center is-layout-flow wp-block-column-is-layout-flow" style="flex-basis:50%">
<h2 class="wp-block-heading has-xx-large-font-size">Make your event one to remember</h2>

<p class="has-large-font-size">Planning a wedding, party or work event? Tell me what you have in mind and we&#8217;ll arrange a live drawing experience to suit your occasion.</p>

<div class="wp-block-buttons is-layout-flex wp-block-buttons-is-layout-flex" style="margin-top:var(--wp--preset--spacing--40)">
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-navy-background-color has-text-color has-background wp-element-button" href="contact.html#event">Check my date</a></div>
</div>
</div>

<div class="wp-block-column is-vertically-aligned-center is-layout-flow wp-block-column-is-layout-flow" style="flex-basis:50%">
<div class="wp-block-group is-style-card plan-card is-layout-flow wp-block-group-is-layout-flow">
<p class="eyebrow">How booking works</p>

<ol class="wp-block-list is-style-steps">
<li><strong>Send your date and venue.</strong> Add a rough guest count and whether you&#8217;d like black and white or colour.</li>
<li><strong>Get your quote.</strong> I&#8217;ll reply by email with my availability and a price.</li>
<li><strong>Lock it in.</strong> On the day I bring the markers and paper and draw your guests.</li>
</ol>
</div>
</div>
</div>
</div>
'''

PORTRAIT_CTA = f'''<div class="wp-block-group alignfull cta-band cta-gift has-global-padding is-layout-constrained wp-block-group-is-layout-constrained" style="padding-top:var(--wp--preset--spacing--70)">
<div class="wp-block-columns alignwide are-vertically-aligned-center is-layout-flex wp-block-columns-is-layout-flex">
<div class="wp-block-column is-vertically-aligned-center is-layout-flow wp-block-column-is-layout-flow" style="flex-basis:40%">
<figure class="wp-block-image size-large is-style-taped"><img decoding="async" src="{I}works/from-photos/from-photos-08.webp" alt="Hand-drawn colour caricature portrait, drawn from a photo"/></figure>
</div>

<div class="wp-block-column is-vertically-aligned-center is-layout-flow wp-block-column-is-layout-flow" style="flex-basis:60%">
<h2 class="wp-block-heading has-xx-large-font-size">Give a gift with a personal story</h2>

<p class="has-large-font-size">Send your photos and ideas, and let&#8217;s turn a familiar face or a special memory into a portrait to treasure.</p>

<p class="eyebrow">What to send me</p>

<ul class="wp-block-list is-style-ticks">
<li>A clear, well-lit photo of each face</li>
<li>Any outfit, pet, background or theme ideas</li>
<li>The date you&#8217;d like it by</li>
</ul>

<div class="wp-block-buttons is-layout-flex wp-block-buttons-is-layout-flex" style="margin-top:var(--wp--preset--spacing--40)">
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-navy-background-color has-text-color has-background wp-element-button" href="contact.html#photo">Start my portrait</a></div>
</div>
</div>
</div>
</div>
'''

out['events.html'] = finish(swap_last_cta(base('events.html'), EVENTS_CTA), 'events.html', 'Drawn by Leon')
out['custom-portraits.html'] = finish(swap_last_cta(base('custom-portraits.html'), PORTRAIT_CTA), 'custom-portraits.html', 'Drawn by Leon')


def build_about():
    s = base('about.html')
    # The last section (Leon has drawn at) becomes a yellow band that runs straight into the footer wave,
    # the same way the yellow band at the end of Live caricatures does (group class "cta-band").
    i = s.index('Leon has drawn at')
    j = s.rindex('<div class="wp-block-group alignfull is-style-panel ', 0, i)
    s = s[:j] + s[j:].replace('alignfull is-style-panel ', 'alignfull cta-band shows-band has-navy-color has-yellow-background-color has-text-color has-background ', 1)
    s = s.replace('<p class="hand-note has-yellow-color has-text-color">Leon has drawn at</p>',
                  '<p class="hand-note has-navy-color has-text-color">Leon has drawn at</p>', 1)
    # "my promise" sat on top of the heading: removed.
    s = re.sub(r'<p class="has-text-align-center hand-note is-small">my promise</p>\s*', '', s, count=1)
    assert 'my promise' not in s
    return finish(s, 'about.html', 'Drawn by Leon')


PRIVACY = '''<div class="wp-block-group alignfull legal-page has-global-padding is-layout-constrained wp-block-group-is-layout-constrained" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">
<h1 class="wp-block-heading page-title has-xx-large-font-size">Privacy &amp; copyright</h1>

<p class="has-large-font-size">This page explains what happens to the details and photos you send to Drawn by Leon, and who owns the drawings.</p>

<p class="has-small-font-size">Last updated: 28 October 2026</p>

<h2 class="wp-block-heading has-x-large-font-size">Your details</h2>

<p>When you send a booking or portrait enquiry, I receive what you type into the form: your name, email address, phone number if you add it, the details of your event or portrait, and any photos you upload.</p>

<p>I use them only to reply to you, prepare a quote, plan your event and draw your portrait. I don&#8217;t sell your details or share them with anyone for marketing.</p>

<h2 class="wp-block-heading has-x-large-font-size">Your photos</h2>

<p>Photos you send are used as reference for your drawing and nothing else. I only share a finished drawing, or a photo of you holding it, on this website or on Instagram and Facebook with your permission.</p>

<p>Ask any time and I&#8217;ll delete the photos you sent.</p>

<h2 class="wp-block-heading has-x-large-font-size">Where it&#8217;s kept</h2>

<p>This website runs on WordPress.com. Form messages and uploaded photos are stored with WordPress.com and in my email inbox.</p>

<p>Visits to the site are counted with Jetpack Stats and Google Analytics. They use cookies to see how many people visit and which pages are popular; they don&#8217;t tell me who you are. You can block these cookies in your browser settings.</p>

<h2 class="wp-block-heading has-x-large-font-size">Your choices</h2>

<p>Email <a href="mailto:leon.caricature@gmail.com">leon.caricature@gmail.com</a> to see, correct or delete the details I hold about you.</p>

<h2 class="wp-block-heading has-x-large-font-size">Copyright</h2>

<p>All drawings, illustrations and photos on this site are &copy; Drawn by Leon unless noted otherwise. Please don&#8217;t copy, print or reuse them without permission.</p>

<p>When you buy a caricature, the original drawing or file is yours to keep, frame, give as a gift and share on your own social media. Copyright in the drawing stays with Leon, so please ask first before using it on products, logos, advertising or anything sold.</p>

<h2 class="wp-block-heading has-x-large-font-size">Contact</h2>

<p>Drawn by Leon, Melbourne VIC<br><a href="mailto:leon.caricature@gmail.com">leon.caricature@gmail.com</a><br><a href="tel:+61466532313">0466 532 313</a></p>
</div>
'''


def build_privacy():
    s = base('about.html')
    a = s.index('<div class="entry-content')
    a = s.index('>', a) + 1
    k = s.index('</div></main>', a)
    return finish(s[:a] + '\n' + PRIVACY + s[k:], 'privacy.html', 'Drawn by Leon')


out['privacy.html'] = build_privacy()


out['about.html'] = build_about()
for name, s in out.items():
    open(name, 'w').write(s)
    print(name, len(s))
