<div class="container mt-4 mb-5">
  <h1 class="space-grotesk mb-4">Einstellungen</h1>

  <!-- g-4 sorgt für automatische Abstände zwischen den Karten (vertikal & horizontal) -->
  <div class="row g-4">
    
    <!-- Auf Handys: 100% Breite (col-12) | Auf iPads/Tablets: 50% (col-md-6) | Auf Desktop: 33% (col-lg-4) -->
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body d-flex flex-column align-items-center text-center">
          <!-- mb-3 für Abstand nach unten zum Button -->
          <img src="/images/edit_categories.png" class="img-fluid rounded shadow-sm mb-4" alt="Kategorien_bearbeiten" style="max-height: 180px; object-fit: contain;">
          
          <!-- mt-auto drückt den Button immer ganz nach unten, falls die Bilder unterschiedlich hoch sind -->
          <div class="mt-auto w-100">
             <a href="/einstellungen/category" class="btn btn-primary w-100">Kategorien bearbeiten</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Gleiche Aufteilung für die zweite Karte -->
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body d-flex flex-column align-items-center text-center">
          <img src="/images/filterattribute_bearbeiten.png" class="img-fluid rounded shadow-sm mb-4" alt="Filterattribute_bearbeiten" style="max-height: 180px; object-fit: contain;">
          
          <div class="mt-auto w-100">
             <a href="/einstellungen/filter_attributes" class="btn btn-primary w-100">Filter bearbeiten</a>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>