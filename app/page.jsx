import { assetPath } from '../lib/assets';
import GardenMotion from '../components/GardenMotion';
import Pollen from '../components/Pollen';
import RsvpEnvelope from '../components/RsvpEnvelope';

export default function InvitationPage() {
  return (
    <GardenMotion>
    <div className="garden-backdrop" aria-hidden="true">
      <img className="landscape motion-layer" src={assetPath('clearing.webp')} width="1440" height="840" alt="" fetchPriority="high" />
      <img className="aisle-flowers motion-layer" src={assetPath('aisle-flowers.webp')} width="1440" height="840" alt="" />
      <Pollen />
    </div>

    <div className="garden-journey">
      <div className="garden" role="region" aria-label="Walk through the garden">
        <div className="threshold-art" aria-hidden="true">
          {/* Keep the center of the opening at 50% in replacement gate artwork. */}
          <div className="gate-camera motion-layer">
            <img className="forest-layer motion-layer" src={assetPath('threshold.webp')} width="2044" height="840" alt="" fetchPriority="high" />
            <img className="arch-layer motion-layer" src={assetPath('floral-arch.webp')} width="2044" height="840" alt="" fetchPriority="high" />
          </div>
          <div className="foreground left-foliage motion-layer"><img src={assetPath('foliage-left.webp')} width="450" height="840" alt="" /></div>
          <div className="foreground right-foliage motion-layer"><img src={assetPath('foliage-right.webp')} width="450" height="840" alt="" /></div>
          <div className="threshold-shade motion-layer"></div>
        </div>
        <div className="garden-frame" aria-hidden="true"><span></span><span></span><span></span><span></span></div>

        <div className="walk-panel threshold-panel">
          <div className="walk-copy threshold-copy motion-layer">
            <p className="threshold-bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="threshold-title" lang="ms">Petang<br /><em>Pertunangan</em></p>
          </div>
          <a className="walk-forward motion-layer" href="#invitation"><span className="enter-cue-label">Scroll to enter</span></a>
        </div>
        <section className="walk-panel chapter" id="invitation" aria-labelledby="invitation-title">
          <div className="walk-copy clearing-copy motion-layer">
            <img src={assetPath('monogram.svg')} alt="" width="74" height="82" />
            <p className="eyebrow">Together with their families</p>
            <h1 id="invitation-title" tabIndex="-1">'Adani <em>&amp;</em> Ikmal</h1>
          </div>
          <a className="walk-forward motion-layer" href="#details">Engagement details</a>
        </section>
        <section className="walk-panel chapter" id="details" aria-labelledby="details-title">
          <div className="walk-copy motion-layer">
            <img className="section-sprig" src={assetPath('sprig.svg')} alt="" width="54" height="47" />
            <p className="eyebrow">Petang Pertunangan</p>
            <h2 id="details-title" tabIndex="-1">Meet us <em>in the garden</em></h2>
            <p className="event-date"><time dateTime="2026-12-25">Friday, 25 December 2026</time><br />3–6 PM</p>
            <address className="venue-address"><strong>12 Jalan SS2/8A</strong><br />47300 Petaling Jaya, Selangor</address>
          </div>
          <a className="walk-forward motion-layer" href="#map">View the map</a>
        </section>
        <section className="walk-panel chapter map-chapter" id="map" aria-labelledby="map-title">
          <div className="walk-copy motion-layer">
            <h2 id="map-title" tabIndex="-1">Getting <em>there</em></h2>
            <address className="venue-address">12 Jalan SS2/8A · 47300 Petaling Jaya</address>
            <figure className="venue-map">
              <img src={assetPath('venue-map.svg')} width="640" height="350" alt="Illustrated neighbourhood map highlighting Jalan SS2/8A in Petaling Jaya" />
              <figcaption><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a></figcaption>
            </figure>
            <div className="map-links">
              <a href="https://www.google.com/maps/dir/?api=1&amp;destination=12%20Jalan%20SS2%2F8A%2C%2047300%20Petaling%20Jaya%2C%20Selangor%2C%20Malaysia" target="_blank" rel="noopener noreferrer" aria-label="Directions in Google Maps" title="Google Maps">
                <svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true">
                  <path d="M12 2a7 7 0 0 0-7 7c0 4.5 5.8 8.7 6.2 12.1a.8.8 0 0 0 1.6 0C13.2 17.7 19 13.5 19 9a7 7 0 0 0-7-7Z" fill="#34a853"/>
                  <path d="M5.5 11.6 14.7 2.5A7 7 0 0 0 5 9c0 .9.2 1.8.5 2.6Z" fill="#ea4335"/>
                  <path d="m5.5 11.6 4.2-4.2L6.9 4.3A7 7 0 0 0 5 9c0 .9.2 1.8.5 2.6Z" fill="#4285f4"/>
                  <path d="M8 15.5c.7.9 1.4 1.8 1.9 2.7l8.9-9A7 7 0 0 0 16 3.3L6.5 13.1Z" fill="#fbbc04"/>
                  <circle cx="12" cy="9" r="2.55" fill="#fffdf4"/>
                </svg>
              </a>
              <a href="https://waze.com/ul?q=12%20Jalan%20SS2%2F8A%2C%2047300%20Petaling%20Jaya%2C%20Selangor%2C%20Malaysia&amp;navigate=yes" target="_blank" rel="noopener noreferrer" aria-label="Directions in Waze" title="Waze">
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                  <path d="M13.9 3.4a8.6 8.6 0 0 0-8.6 8.5c0 1.8-.9 3-3 3.6 1 2.1 4 3.4 6.6 3.4h5a7.8 7.8 0 1 0 0-15.5Z" fill="#a4dce5" stroke="#284641" strokeWidth="1.35" strokeLinejoin="round"/>
                  <circle cx="8.8" cy="19" r="2" fill="#284641"/>
                  <circle cx="16.7" cy="19" r="2" fill="#284641"/>
                  <circle cx="11.4" cy="10" r=".85" fill="#284641"/>
                  <circle cx="16.6" cy="10" r=".85" fill="#284641"/>
                  <path d="M11.3 13.2a3.2 3.2 0 0 0 5.3 0" fill="none" stroke="#284641" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </a>
            </div>
          </div>
          <a className="walk-forward motion-layer" href="#itinerary">View the programme</a>
        </section>
        <section className="walk-panel chapter" id="itinerary" aria-labelledby="itinerary-title">
          <div className="walk-copy motion-layer">
            <p className="eyebrow">3–6 PM</p>
            <h2 id="itinerary-title" tabIndex="-1">Itinerary <em>Programme</em></h2>
            <ol className="schedule">
              <li><time dateTime="15:00">3:00</time><div><span>Arrival, kuih &amp; drinks</span></div></li>
              <li><time dateTime="15:30">3:30</time><div><span lang="ms">Perbincangan keluarga</span><small>(duration tunang, berapa dulang, date)</small></div></li>
              <li><time dateTime="15:50">3:50</time><div><span lang="ms">Doa</span></div></li>
              <li><time dateTime="16:00">4:00</time><div><span>Sarung cincin, salam-salam, photos &amp; buffet</span></div></li>
              <li><time dateTime="16:30">4:30</time><div><span>Makan &amp; family time</span></div></li>
              <li><time dateTime="18:00">6:00</time><div><span>Expected finish</span></div></li>
            </ol>
          </div>
          <a className="walk-forward motion-layer" href="#rsvp">RSVP</a>
        </section>
        <div className="journey-progress" aria-hidden="true"><span className="motion-layer"></span></div>
      </div>
    </div>
      <RsvpEnvelope eventId="engagement" />
    </GardenMotion>
  );
}
