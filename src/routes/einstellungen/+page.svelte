<div class="container mt-4 mb-5 space-grotesk">
  <h1 class="mb-4 page-title">Einstellungen</h1>

  <div class="row g-4">
    
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card dark-card h-100 shadow-sm">
        <div class="card-body d-flex flex-column align-items-center text-center p-4">
          <img 
            src="/images/edit_categories.png" 
            class="img-fluid rounded mb-4 image-frame" 
            alt="Kategorien bearbeiten" 
            style="max-height: 180px; object-fit: contain;"
          >
          
          <div class="mt-auto w-100">
             <a href="/einstellungen/category" class="btn btn-custom-primary w-100">Kategorien bearbeiten</a>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-6 col-lg-4">
      <div class="card dark-card h-100 shadow-sm">
        <div class="card-body d-flex flex-column align-items-center text-center p-4">
          <img 
            src="/images/filterattribute_bearbeiten.png" 
            class="img-fluid rounded mb-4 image-frame" 
            alt="Filterattribute bearbeiten" 
            style="max-height: 180px; object-fit: contain;"
          >
          
          <div class="mt-auto w-100">
             <a href="/einstellungen/filter_attributes" class="btn btn-custom-primary w-100">Filter bearbeiten</a>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

<style>
  /* Globale Schriftart für diesen Container */
  .space-grotesk {
    font-family: "Space Grotesk", sans-serif;
    color: #cbd5e1;
  }

  /* Titel im globalen Grün */
  .page-title {
    color: #22c55e;
    font-weight: 700;
  }

  /* Dark Mode Karte (überschreibt Bootstrap Defaults) */
  .dark-card {
    background-color: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }
  
  /* Cooler Hover-Effekt für die Karten */
  .dark-card:hover {
    transform: translateY(-5px);
    border-color: #475569;
    box-shadow: 0 15px 25px -5px rgba(0, 0, 0, 0.4) !important;
  }

  /* Edler Rahmen für die Bilder im Dark Mode */
  .image-frame {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    background-color: #0f172a; /* Dunkler Hintergrund, falls das Bild transparent ist */
    padding: 0.5rem;
    border: 1px solid #334155;
  }

  /* Custom Button (ersetzt das Standard-Bootstrap-Blau) */
  .btn-custom-primary {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 0.8rem;
    font-weight: 600;
    font-size: 1rem;
    border-radius: 8px;
    transition: background-color 0.2s ease;
  }

  .btn-custom-primary:hover {
    background-color: #2563eb;
    color: white;
  }
</style>