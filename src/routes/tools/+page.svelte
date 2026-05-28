<script>
    // Wir lagern das Bookmarklet-JavaScript in eine Variable aus. 
    // Dadurch kommt der Svelte-Compiler nicht mit den geschweiften Klammern { } durcheinander.
    // Wichtig: \s muss in einem String als \\s escaped werden!
    const bookmarkletCode = "javascript:(function(){var title=document.title;var url=window.location.href;var descMeta=document.querySelector('meta[name=\"description\"]')||document.querySelector('meta[property=\"og:description\"]');var desc=descMeta?descMeta.content:document.body.innerText;desc=desc.replace(/\\s+/g,' ').trim().substring(0,800);var imgMeta=document.querySelector('meta[property=\"og:image\"]')||document.querySelector('meta[name=\"twitter:image\"]');var imgUrl=imgMeta?imgMeta.content:'';if(!imgUrl){var firstImg=document.querySelector('img:not(header img, footer img, .icon img)');if(firstImg)imgUrl=firstImg.src;}var target='https://sortify-inventory-management.netlify.app/addarticle?title='+encodeURIComponent(title)+'&url='+encodeURIComponent(url)+'&desc='+encodeURIComponent(desc)+'&img='+encodeURIComponent(imgUrl);window.open(target,'_blank');})();";

    // Das onclick-Event wird in Svelte "The Svelte Way" gehandhabt
    function handleClick(event) {
        event.preventDefault(); // Verhindert, dass der Link wie ein normaler Link geklickt wird
        alert('Bitte klicke nicht auf den Button, sondern ZIEHE ihn in deine Lesezeichenleiste oben im Browser!');
    }
</script>

<svelte:head>
    <title>Sortify Lesezeichen installieren</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
    <div class="container">
        <h1>Sortify KI-Importer</h1>
        <p class="instruction">
            Um Produkte von beliebigen Webseiten direkt in Sortify zu importieren, musst du nur den blauen Button unten <strong>mit gedrückter Maustaste nach oben in deine Lesezeichenleiste ziehen</strong>.
        </p>
        
        <a 
            class="bookmarklet-btn" 
            title="Sortify KI-Import" 
            href={bookmarkletCode} 
            on:click={handleClick}
        >
            ➕ Zu Sortify hinzufügen
        </a>

        <p class="gif-hint">
            (Tipp: Stelle sicher, dass deine Lesezeichenleiste eingeblendet ist. Bei den meisten Browsern geht das mit <strong>Strg + Umschalt + B</strong> oder <strong>Cmd + Shift + B</strong> auf dem Mac).
        </p>
    </div>
</div>

<style>
    /* CSS bleibt gleich, wird von Svelte aber automatisch auf diese Komponente beschränkt */
    
    /* Um den Hintergrund der ganzen Seite zu ändern, nutzen wir :global(body) in Svelte */
    :global(body) { 
        font-family: 'Space Grotesk', sans-serif; 
        background-color: #f8fafc; 
        color: #334155; 
        margin: 0;
    }

    .page-wrapper {
        text-align: center; 
        padding: 100px 20px; 
    }

    .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        border: 1px solid #e2e8f0;
    }

    h1 { 
        color: #22c55e; 
        margin-top: 0; 
    }

    .instruction { 
        font-size: 1.1rem; 
        color: #64748b; 
        line-height: 1.6; 
        margin-bottom: 30px; 
    }
    
    .bookmarklet-btn {
        display: inline-block;
        background-color: #3b82f6;
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 700;
        font-size: 1.2rem;
        cursor: grab; 
        transition: background 0.2s;
        border: 2px dashed #2563eb; 
    }

    .bookmarklet-btn:hover { 
        background-color: #2563eb; 
    }

    .bookmarklet-btn:active { 
        cursor: grabbing; 
    }
    
    .gif-hint {
        margin-top: 30px;
        font-size: 0.9rem;
        color: #94a3b8;
    }
</style>