# Projektdokumentation - digitales Kleinteilelager

## Inhaltsverzeichnis

1. [Ausgangslage](#1-ausgangslage)
2. [Lösungsidee](#2-lösungsidee)
3. [Vorgehen & Artefakte](#3-vorgehen--artefakte)
    1. [Understand & Define](#31-understand--define)
    2. [Sketch](#32-sketch)
    3. [Decide](#33-decide)
    4. [Prototype](#34-prototype)
    5. [Validate](#35-validate)
4. [Erweiterungen [Optional]](#4-erweiterungen-optional)
5. [Projektorganisation [Optional]](#5-projektorganisation-optional)
6. [KI-Deklaration](#6-ki-deklaration)
7. [Anhang [Optional]](#7-anhang-optional)

> **Hinweis:** Massgeblich sind die im **Unterricht** und auf **Moodle** kommunizierten Anforderungen.

<!-- WICHTIG: DIE KAPITELSTRUKTUR DARF NICHT VERÄNDERT WERDEN! -->

<!-- Diese Vorlage ist für eine README.md im Repository gedacht. Abschnitte mit [Optional] können weggelassen werden, wenn in den Übungen nichts anderes verlangt wird. -->

## 1. Ausgangslage
<!-- Kurz beschreiben, welches Problem adressiert wird und welches Ergebnis angestrebt ist. Wem nützt die Lösung, wer ist beteiligt oder betroffen?-->
- **Problem:** _Die Lagerung von Kleinteilen (Schrauben, Muttern,Elektrotechnikbauteilen usw.) ist in privaten Werkstätten und kleinen Betrieben oft sehr unübersichtlich und eine Herausforderung. Die Suche nach dem passenden Teil kostet viel Zeit und die Lagerhaltung wird oft vernachlässigt, da es von Hand sehr zeitaufwendig (ständig neue Beschriftung der einzelnen Fächer mit Artikelbezeichnung, Zählen des Bestands usw.) und fehleranfällig ist. Dies führt oft zu dem frustrierenden Moment, dass essenzielle Teile (z. B. eine spezifische M3-Schraube) genau dann fehlen, wenn sie mitten in einem Projekt dringend benötigt werden. Ebenso führt es zu Fehlkäufen, da man bereits vorhandenes Verbrauchsmaterial im Baumarkt erneut kauft, obwohl man diese bereits auf Lager hat._
- **Ziele:** 
    - Verkürzung der Suchzeit durch  visuelle Führung (Pick-by-Light) und passende Filteroptionen durch Benutzeroberfläche.

    - Reduzierung von Fehlkäufen durch transparente Bestandsübersicht, welche über das Internet erreichbar ist.

    - Vollständige Automatisierung der Bestandskontrolle nach der Entnahme (z. B. durch sensorgestützte Gewichtsmessung) über GPIO Pins von Arduino.

    - Automatisierten Errinnerungssystem, das bei Unterschreitung von Mindestbeständen per Mail zum Nachkauf auffordert.

    - Verhindern von ständigem kompliziertem Beschriften der Fächer, nach Änderung des Inhalts.


- **Primäre Zielgruppe:** _Heimwerker, Hardware Bastler_  
- **Weitere Stakeholder:** _Kleinbetriebe, Shared-Workspaces, Lieferanten, Baumärkte_  


## 2. Lösungsidee
<!--Beschreibt die Lösungsidee.-->
- **Kernfunktionalität:** 
  - **Suchen & Finden:** Nutzer filtern in der SvelteKit-Web-App nach Attributen (z. B. M3-Schraube, 20mm Länge). Nach der Auswahl sendet die App ein Signal an einen Raspberry Pi, der die LED am entsprechenden Fach im Regal aufleuchten lässt (Pick-by-Light).

  - **Automatisierte Bestandsführung:** Nach der Entnahme wird das Fach auf eine mit einem Raspberry Pi verbundene Waage gestellt und der Barcode mit dem Scanner abgescannt. Das System berechnet anhand des Gewichts und des Barcodes automatisch die Restmenge und aktualisiert den Bestand in der Datenbank.

  - **Intelligente Benachrichtigung:** Das System prüft den Bestand gegen einen hinterlegten Mindestwert. Bei Unterschreitung wird automatisch eine E-Mail mit einem direkten Nachkauf-Link an den Besitzer versendet.

  - **Mobiler Datenzugriff (Projektarbeit):** Da die Anwendung online zugänglich ist, kann der aktuelle Lagerbestand jederzeit von unterwegs (z. B. im Baumarkt) eingesehen werden.
    - **Aufrufen des Inventars** durch Filterung nach Kategorien und Unterkategorien, sowie Suchfeld inkl. Detailanzeige.

    - **Bestellen** Filterung der Artikel nach diversen Kriterien (ordnen nach Artikelart, Bestand)
		Ausgabe von einer Liste mit Bestelllink
		Anzeigen der Bestelllinks
    Als bestellt vermerken um auf der "In Bestellung" Liste angezeigt zu werden.

    - **In Bestellung**	Anzeige der ausstehenden Lieferungen,
		Bestätigung nach Erhalt inkl. Aktualisierung des Bestands (Anpassung der Bestellmenge möglich)

    - **Kategorien verwalten** Verwalten der Attribute je Kategorie, Attribute können pro Kategorie hinzugefügt, bearbeitet und gelöscht werden. Diese dienen dann als Vorlage für "Artikel hinzufügen" und wird für die Filteroptionen verwendet.

    - **Artikel hinzufügen** Auswahl der Kategorie, Angabe der Artikeldetails, Angabe des Mindestbestands, (Angabe des Lagerorts), Angabe des Bestelllinks, (Angabe des Gewichts pro Stück).

    
    
- **Annahmen:** 
    - _Die visuelle Führung mittels LEDs reduziert die Suchzeit im Vergleich zu herkömmlichen Beschriftungen signifikant._
    - _Die automatisierte Bestandsführung mittels Waage ist präzise genug, um die Bestandsmenge zuverlässig zu erfassen._

- **Abgrenzung:** _Innerhalb des Projekts wird nur die Software für die Webanwendung für den mobilen Datenzugriff auf den Lagerbestand entwickelt. Die weiteren technischen Komponenten wie die Hardware (Raspberry Pi, Waage, LEDs, Scanner), sowie die Software für den Raspberry PI zum Hinzufügen und Entfernen von Artikeln werden innerhalb dieses Projekts nicht entwickelt._

<!-- Stand 17.04.2026 --> 







## 3. Vorgehen & Artefakte
Die Durchführung erfolgt phasenbasiert; dokumentieren Sie die wichtigsten Ergebnisse je Phase.

### 3.1 Understand & Define
- **Zielgruppenverständnis:** _[Problemraumanalyse, Recherche, (Proto-)Personas]_
- **Wesentliche Erkenntnisse:** _[Stichpunkte]_

### 3.2 Sketch
- **Variantenüberblick:** _[kurz]_
- **Skizzen:** _[Mehrere Varianten; Unterschiede kurz dokumentieren.]_

### 3.3 Decide
- **Gewählte Variante & Begründung:** _[Entscheidkriterien nennen]_  
- **End-to-End-Ablauf:** _[Beschreibung inkl. User Journey Map]_  
- **Mockup:** _[URL, z. B. Figma; Screenshots mit kurzen Beschreibungen]_  

### 3.4 Prototype

#### 3.4.1. Entwurf (Design)
Beschreibt die Gestaltung und Interaktion.
> **Hinweis:** Hier wird der **Prototyp** beschrieben, nicht das **Mockup**.
- **Informationsarchitektur:** _[z. B. Seiten/Navigation: Konzept, nicht die technische Umsetzung]_
- **User Interface Design:** _[wichtige Screens: Screenshots mit kurzen Erläuterungen]_  
- **Designentscheidungen:** _[zentrale Entscheidungen und Begründungen]_

#### 3.4.2. Umsetzung (Technik)
Fasst die technische Realisierung zusammen.
- **Technologie-Stack:** _[SvelteKit, Bibliotheken falls genutzt]_
- **Tooling:** _[IDE/Erweiterungen, lokale/Cloud-Tools; den Einsatz von KI beschreiben Sie im Kapitel **KI-Deklaration**]_  
- **Struktur & Komponenten:** _[Seiten, Routen, State/Stores, wichtige Komponenten]_
- **Daten & Schnittstellen:** _[Wie werden Daten gespeichert, verwaltet, abgerufen?]_
- **Deployment:** _[URL]_  
- **Besondere Entscheidungen:** _[z. B. Trade-offs, Vereinfachungen]_  

### 3.5 Validate
- **URL der getesteten Version** (separat deployt)
- **Ziele der Prüfung:** _[welche Fragen sollen beantwortet werden?]_  
- **Vorgehen:** _[moderiert/unmoderiert; remote/on-site]_  
- **Stichprobe:** _[Mit wem wurde getestet? Profil; Anzahl]_  
- **Aufgaben/Szenarien:** _[Ausformulierte Testaufgaben]_  
- **Kennzahlen & Beobachtungen:** _[z. B. Erfolgsquote, Zeitbedarf, qualitative Findings]_  
- **Zusammenfassung der Resultate:** _[Wichtigste Erkenntnisse; 2-4 Sätze]_  
- **Abgeleitete Verbesserungen:** _[Anforderungen, die als nächstes umgesetzt werden sollten, priorisiert, kurz begründet; falls Verbesserungen im Prototyp konkret umgesetzt wurden: In Kap. 4 dokumentieren]_  

## 4. Erweiterungen [Optional]
Dokumentiert Erweiterungen über den Mindestumfang hinaus.
> **Hinweis:** Jede Erweiterung ist separat nach dem folgenden Schema zu beschreiben.

### _[4.x Kurzbeschreibung / Titel]_  
- **Beschreibung & Nutzen:** _[Was wurde erweitert? Warum?]_  
- **Wo umgesetzt:** _[Wie und wo wurde es gemacht? Frontend, Backend, Datenbank?]_  
- **Referenz:** _[Wo wird die Erweiterung auch noch beschrieben, z.B. Screenshot oder Beschreibung in einem anderen Kapitel]_  
- **Aus Evaluation abgeleitet?:** _[Wurde diese Erweiterung als Folge eines in der Evaluation identifizierten Issues implementiert?]_  

> Das folgende **Beispiel** wurde bewusst kurz gehalten. Erweiterungen dürfen auch ausführlicher beschrieben werden.

### 4.1 Tabelle nach Kategorien filtern
- **Beschreibung & Nutzen:** Tabelle X kann nach Kategorie gefiltert werden, weil User typischerweise nur an einer bestimmten Kategorie interessiert sind.  
- **Wo umgesetzt:** 
  - **Frontend:** Tabelle mit Dropdown in Datei ...
  - **Backend:** Form Action ... in Datei ...
  - **Datenbank:** MongoDB-Query in Datei ...
- **Referenz:** Screenshot in Kap. x.y
- **Aus Evaluation abgeleitet?:** Ja, Issue x.y

## 5. Projektorganisation [Optional]
Beispiele:
- **Repository & Struktur:** _[Link; kurze Strukturübersicht]_  
- **Issue-Management:** _[Vorgehen kurz beschreiben]_  
- **Commit-Praxis:** _[z. B. sprechende Commits]_

## 6. KI-Deklaration
Die folgende Deklaration ist verpflichtend und beschreibt den Einsatz von KI im Projekt.

### 6.1 KI-Tools
- **Eingesetzte Tools**: _[z. B. Copilot, ChatGPT, Claude, lokale Modelle; Version/Variante wenn bekannt]_
- **Zweck & Umfang**: _[wie, wofür und in welchem Ausmass wurde KI eingesetzt (z. B. Textentwürfe, Codevorschläge, Tests, Refactoring); welche Teile stammen (ganz/teilweise) aus KI-Unterstützung?]_
- **Eigene Leistung (Abgrenzung):** _[was ist eigenständig erarbeitet/überarbeitet worden?]_

### 6.2 Prompt-Vorgehen
_[Überlegungen zu Prompt-Vorgehen, Qualität und Urheberrecht/Quellen. Wie wurde beim Prompting vorgegangen? Zu beschreiben ist die grundlegende Vorgehensweise. Einzelne, konkrete Prompts sollten höchstens als Beispiele aufgeführt werden. ]_

### 6.3 Reflexion
_[Nutzen, Grenzen, Risiken/Qualitätssicherung, ...]_

## 7. Anhang [Optional]
Beispiele:
- **Quellen:** _[verwendete Vorlagen/Assets/Modelle; Lizenz/Urheberrecht; ...]_
- **Testskript & Materialien:** _[Link/Datei]_  
- **Rohdaten/Auswertung:** _[Link/Datei]_  

