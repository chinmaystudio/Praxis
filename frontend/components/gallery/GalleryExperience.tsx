"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import SiteHeader from "@/components/ui/SiteHeader";
import { GALLERY } from "@/lib/gallery";
import styles from "./gallery.module.css";

const number = (value: number) => String(value).padStart(2, "0");
const assetVersion = "20261004-final";

function Arrow({ previous = false }: { previous?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={previous ? "M19 12H5m7-7-7 7 7 7" : "M5 12h14m-7-7 7 7-7 7"} /></svg>;
}

export default function GalleryExperience() {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const strip = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const photo = GALLERY[active];
  const move = (delta: number) => setActive(current => (current + delta + GALLERY.length) % GALLERY.length);
  const onKeys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "Home") { event.preventDefault(); setActive(0); }
    if (event.key === "End") { event.preventDefault(); setActive(GALLERY.length - 1); }
  };
  useEffect(() => {
    const row = strip.current;
    const selected = row?.children[active] as HTMLElement | undefined;
    if (row && selected) row.scrollTo({ left: selected.offsetLeft - row.clientWidth / 2 + selected.clientWidth / 2, behavior: "instant" });
  }, [active]);

  return <div className={styles.page}>
    <SiteHeader cinematic={false} galleryActive />
    <main className={styles.main}>
      <div className={styles.intro}>
        <div><p className={styles.eyebrow}><span /> THE PRAXIS PHOTO ARCHIVE</p><h1>YOU HAD TO <span>BE THERE.</span></h1></div>
        <p className={styles.introNote}>The people. The energy. The moments.<br />Step inside the memories that made us.</p>
      </div>

      <section className={styles.gallery} aria-label="Praxis photo gallery" aria-roledescription="carousel" tabIndex={0} onKeyDown={onKeys}>
        <div className={styles.viewer}>
          <div className={styles.stage} onTouchStart={event => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={event => {
            const start = touchStart.current; touchStart.current = null;
            if (!start) return;
            const touch = event.changedTouches[0]; const x = touch.clientX - start.x; const y = touch.clientY - start.y;
            if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(y) * 1.5) move(x < 0 ? 1 : -1);
          }}>
            <div className={styles.frameTop}><span>PRAXIS / IN FOCUS</span><button type="button" className={styles.expand} onClick={() => dialog.current?.showModal()} aria-label="Enlarge current photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /></svg><span>EXPAND</span></button></div>
            <div className={styles.viewport}>
              <div className={styles.track} style={{ transform: `translateX(-${active * 100}%)` }}>
                {GALLERY.map((item, index) => <div key={item.id} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${GALLERY.length}: ${item.title}`} aria-hidden={index !== active}>
                  {failed.includes(item.id) ? <p className={styles.imageError}>This photo couldn&apos;t load. Try another moment.</p> : <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.backdrop} src={`/gallery/${item.id}-thumb.webp?v=${assetVersion}`} alt="" aria-hidden="true" loading="lazy" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={`${styles.photo} ${styles.photoContain}`} style={{ objectPosition: item.position }} src={`/gallery/${item.id}.webp?v=${assetVersion}`} alt={item.alt} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" onError={() => setFailed(current => current.includes(item.id) ? current : [...current, item.id])} />
                  </>}
                </div>)}
              </div>
            </div>
            <div className={styles.frameBottom}><span>THE MOMENT, IN FULL.</span><span>← → <span className={styles.desktopHint}>USE ARROW KEYS</span><span className={styles.mobileHint}>SWIPE TO EXPLORE</span></span></div>
          </div>
          <div className={styles.story}>
            <div className={styles.storyTop}><span>THE COLLECTION</span><span className={styles.statusDot} /></div>
            <div className={styles.count} aria-hidden="true"><strong>{number(active + 1)}</strong><span>/ {number(GALLERY.length)}</span></div>
            <div className={styles.caption} aria-live="polite" aria-atomic="true"><span className={styles.srOnly}>Photo {active + 1} of {GALLERY.length}. </span><p className={styles.category}>{photo.category}</p><h2>{photo.title}</h2><p className={styles.description}>{photo.description}</p></div>
            <div className={styles.controls}><button type="button" onClick={() => move(-1)} aria-label="Previous photo"><Arrow previous /></button><button type="button" onClick={() => move(1)} aria-label="Next photo"><span>NEXT MOMENT</span><Arrow /></button></div>
            <div className={styles.progress} aria-hidden="true"><span style={{width:`${((active + 1) / GALLERY.length) * 100}%`}} /></div>
          </div>
        </div>
        <div className={styles.stripHeader}><span>CHOOSE YOUR MOMENT</span><span>{number(GALLERY.length)} FRAMES / ONE PRAXIS</span></div>
        <div className={styles.filmstrip} ref={strip} aria-label="Choose a photo">
          {GALLERY.map((item, index) => <button type="button" key={item.id} className={styles.thumbnail} aria-label={`Show photo ${index + 1}: ${item.title}`} aria-pressed={active === index} onClick={() => setActive(index)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/gallery/${item.id}-thumb.webp?v=${assetVersion}`} alt="" loading="lazy" width="144" height="94" />
            <span>{number(index + 1)}</span>
          </button>)}
        </div>
      </section>
      <div className={styles.closing}><p>Good moments start with great people.</p><Link href="/team">MEET THE TEAM <Arrow /></Link></div>
    </main>
    <footer className={styles.footer}><span>© 2026 PRAXIS · PCCOE PUNE</span><nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/team">Team</Link><Link href="/sponsors">Sponsors</Link><Link href="/events">Events</Link></nav></footer>
    <dialog ref={dialog} className={styles.dialog} aria-label="Expanded photo viewer" onKeyDown={onKeys} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className={styles.dialogBar}><p aria-live="polite">{number(active + 1)} / {number(GALLERY.length)} · {photo.title}</p><button type="button" onClick={() => dialog.current?.close()} aria-label="Close expanded photo">CLOSE <span aria-hidden>×</span></button></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/gallery/${photo.id}.webp?v=${assetVersion}`} alt={photo.alt} className={styles.dialogPhoto} />
      <div className={styles.dialogControls}><button type="button" onClick={() => move(-1)} aria-label="Previous expanded photo"><Arrow previous /> PREVIOUS</button><button type="button" onClick={() => move(1)} aria-label="Next expanded photo">NEXT <Arrow /></button></div>
    </dialog>
  </div>;
}
