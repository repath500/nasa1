# DS-5 — Cross-cutting data-resource audit (all 14 challenges)

**Audit date:** 2026-11-14 (hackathon weekend is 14–15 November 2026)
**Scope:** every link in the `## Resources` section of all 14 files in `research/challenges/`.
**Method:** extracted **139 citations → 133 unique URLs**; `curl -sL` with a desktop user agent, redirects followed, 25–30 s timeout; re-checked JavaScript-only services through their APIs, docs and service endpoints. HTTP codes are the final response after redirects.
**What this file is not:** it does not propose per-challenge project concepts. DS-1…DS-4 cover those.

---

## 0. Headline numbers

- **139 resource citations, 133 unique URLs** across 14 challenges. (An earlier draft said 134; the correct unique count is 133. The stray 134th row was `backyardworlds.org`, which is mentioned in the SPHEREx challenge body, not in its Resources section.)
- **130 of 133 return HTTP 200.** One is 403 (Medium, bot block), one is 500 (RadLab GUI), one is 000 (NRCS, Akamai edge stalls in this environment). The CSA Moon page returned 000 once and 200 on retry — it is live.
- **At least 10 of the 200s are JavaScript shells**, not machine-readable data: PSI, Mars Trek, Moon Trek, Worldview, OSDR repository, ESA Open Science Catalog, CropScape (now a sign-in shell), Lunar Quickmap, Earthdata Search, AppEEARS and Giovanni. “200” is not “usable data”.
- **Only 4 URLs are reused across challenges**; 129 appear exactly once. The official lists are heavily siloed.
- **Data density is extremely uneven:** FARMS has 26 links; FIRMS has 1; LUNAR has 4; HEALTH and MARS have 5 each.
- **EOSDIS FY2026 metrics** (1 Oct 2025–30 Sep 2026): 18,839 collections, **225.7 PB** total archive (**152.1 PB** in cloud), **174 TB/day** archive growth, **1,443.5 TB/day** distributed, 14.1 M distinct users ([NASA Earthdata metrics](https://www.earthdata.nasa.gov/about/data-metrics)). You cannot download it; you must subset.
- **NISAR is real and public, but the validated record is short.** VALIDATED L0–L2 released **6 Nov 2026** for acquisitions from **21 Oct 2026**; PROVISIONAL released **20 Jul 2026** for acquisitions from **17 Jun 2026** (through part of 23 Oct 2026); BETA released **27 Feb 2026** (>100,000 L1–L3 products, >500 TB, subset of 17 Oct 2025–20 Jan 2026) ([ASF NISAR availability](https://nisar-docs.asf.alaska.edu/availability-overview/)). There is a permanent instrument data gap **2026-07-27T22:03:25Z–2026-08-10T00:55:27Z**. S-band products are distributed by ISRO’s Bhoonidhi hub.
- **SPHEREx DR1 is live at IRSA (November 2026)**, with QR2/QR3, and an open AWS S3 bucket **`nasa-irsa-spherex`** (verified `ListBucket` 200, no-sign-request) ([IRSA SPHEREx](https://irsa.ipac.caltech.edu/Missions/spherex.html)).
- The most important resources **absent from all 14 lists** are **`earthaccess`, CMR/STAC, GIBS directly, `asf_search`, `astropy`, the open SPHEREx S3 bucket and the Trek REST services**. They would save every team at least half a day.
- **The official lists are not frozen.** Several challenge pages say “more resources may be added before the hackathon begins”; re-check the Resources tab on 13 November and diff it against this catalog.

### 0.1 Link health and composition by challenge

| Code | Challenge | Citations | Unique | NASA | Partner agency | Other U.S. agency / non-profit | Other / non-gov | Link issues |
|---|---|---|---|---|---|---|---|---|
| FARMS | Field Shift: Adapting Farms | 26 | 26 | 9 | 2 | 12 | 3 | none broken; CropScape now sign-in |
| SAR | Dancing with the SARs | 14 | 14 | 9 | 5 | 0 | 0 | none broken |
| TREND | Earth System Trend Detective | 13 | 13 | 4 | 5 | 1 | 3 | 1 × 403 (Medium) |
| FLAME | Flame in Freefall | 10 | 10 | 10 | 0 | 0 | 0 | none broken; PSI is login-gated |
| HEALTH | Health Monitoring Software | 5 | 5 | 3 | 2 | 0 | 0 | none broken; no dataset at all |
| MARS | Martian Map | 5 | 5 | 4 | 0 | 1 | 0 | Worldview is Earth-only |
| JUNIOR | Junior Astronaut Trainer | 8 | 8 | 6 | 2 | 0 | 0 | RadLab GUI 500 |
| LUNAR | Lunar Landing Site Navigator | 4 | 4 | 3 | 1 | 0 | 0 | none broken |
| FIRMS | MODIS/VIIRS Hot Spots | 1 | 1 | 1 | 0 | 0 | 0 | severe under-linking |
| RELIC | Discarded Equipment | 14 | 14 | 14 | 0 | 0 | 0 | none broken |
| ANALOG | Earth Analogs of Moon/Mars | 11 | 11 | 5 | 6 | 0 | 0 | 8 URLs carry `utm_source='chatgpt.com'` |
| SPHEREX | Planet X and SPHEREx | 8 | 8 | 2 | 5 | 0 | 1 | none broken |
| GAME | Space Mission Design Game | 9 | 9 | 8 | 1 | 0 | 0 | Mission Viz has no licence |
| JUKE | Earth Information Jukebox | 11 | 11 | 11 | 0 | 0 | 0 | none broken |

Counts are link-level. SPHEREx is manually reclassified: IRSA and the Caltech/IPAC notebooks count as NASA-funded; WiseView as non-government. Backyard Worlds is excluded because it is not in the Resources section.

---

## 1. Master catalog — every resource link

**How to read this table**

- One row per **unique URL**. A URL cited by several challenges appears once, with every challenge code in column 2 — this also makes reuse visible.
- **Partner-agency resources** are identified in the Provider column (CSA, ESA, JAXA, CONAE, USDA, USGS, NOAA, etc.). Their Type uses the same vocabulary (dataset, API, tool, paper, portal) so they can be compared directly with NASA resources.
- **Provider** is the organisation that publishes the linked page, which is not always the mission owner (e.g. NISAR is NASA–ISRO but the data guide is hosted by ASF; SWOT is NASA/CNES but the only linked page is CSA’s).
- **U** = usefulness 1–5 (5 = core, directly usable, open; 4 = strong supporting; 3 = useful secondary/context; 2 = background; 1 = cosmetic/inspirational).
- **HTTP**: 200 = live; 403 = bot-blocked but works in a browser; 500 = server error; 000 = connection blocked in this environment; `302→200` = redirects to a sign-in page.
- **Size**: `~` means an estimate, not a vendor-published figure. `N/A` means the URL is a portal, tool, paper or service, not a data volume.
- **Access codes**: `EDL` Earthdata Login; `EDL-DL` Earthdata Login only for download; `KEY` free API key; `MAPKEY` FIRMS MAP_KEY; `ACCT` free account; `ACCT+LIC` account + licence acceptance; `ACCT+AGR` account + agreement/licence; `TOKEN` free API token; `GUEST` NASA Guest Account; `USGS` USGS ERS account; `None` no auth.
- **Licence codes**: `CC0` NASA-led default; `PD` U.S. public domain; `OGL-CA` Open Government Licence – Canada; `COPERNICUS` Copernicus Legal Notice; `VARIES` per dataset; `CUSTOM` provider-specific; `NONE DECLARED` no licence file found.
- `*` after a status code marks a URL that carries a `utm_source` tag. Some are duplicates of another row; some are the only version of that link.
- **Metadata confidence:** link status was curl-verified; format/access/licence summaries come from the provider pages. `~` sizes are estimates. Licence cells are a practical summary, not legal advice; confirm before any commercial use.

### Part A — Earth observation, fire, agriculture, climate and terrestrial analogs (60 URLs)

| # | Challenge(s) | Resource | URL | Type | Provider | Format | Access / auth | Size | License / terms | HTTP | U |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | SAR | ASF Vertex | <https://search.asf.alaska.edu/> | tool + API | NASA / ASF DAAC | web + SearchAPI | EDL | PB | PD | 200 | 5 |
| 2 | ANALOG | Copernicus Data Space (UTM) | <https://dataspace.copernicus.eu/?utm_source=%27chatgpt.com%27> | portal (UTM variant) | ESA / EU | JP2, GeoTIFF, SAFE | ACCT | PB | COPERNICUS | 200* | 5 |
| 3 | FARMS | Copernicus Sentinel-2 | <https://dataspace.copernicus.eu> | dataset + portal | ESA / EU | JP2, GeoTIFF, SAFE | ACCT | ~0.5-1 GB/scene; PB archive | COPERNICUS | 200 | 5 |
| 4 | ANALOG | Earthdata Search (UTM) | <https://search.earthdata.nasa.gov/?utm_source=%27chatgpt.com%27> | tool (UTM variant) | NASA ESDIS | web | EDL-DL | portal | CC0 | 200* | 5 |
| 5 | FIRMS | FIRMS | <https://www.earthdata.nasa.gov/data/tools/firms> | tool + API | NASA LANCE | CSV, SHP, KML, TXT | MAPKEY | MBs/query | CC0 | 200 | 5 |
| 6 | FARMS | GPM / IMERG | <https://gpm.nasa.gov/data> | dataset + portal | NASA GSFC / JAXA | HDF5, NetCDF4; GeoTIFF browse | EDL | granules ~MBs; ~GB/day global | CC0 (credit JAXA on joint products) | 200 | 5 |
| 7 | FARMS | Landsat | <https://earthexplorer.usgs.gov/> | dataset + portal | NASA / USGS | GeoTIFF, COG | USGS login | ~0.6-1.5 GB/scene; PB archive | PD | 200 | 5 |
| 8 | ANALOG | LRO PDS | <https://pds-geosciences.wustl.edu/missions/lro/?utm_source=%27chatgpt.com%27> | archive | NASA / WUSTL | PDS4, IMG | None | TB | PD | 200* | 5 |
| 9 | FARMS | MODIS | <https://lpdaac.usgs.gov/products/> | portal | NASA LP DAAC | HDF4, GeoTIFF | EDL | ~MBs/tile; ~TB archive | CC0 | 200 | 5 |
| 10 | SAR | NASA Earthdata Search | <https://search.earthdata.nasa.gov/search> | tool | NASA ESDIS | web + CMR API | EDL-DL | portal | CC0 | 200 | 5 |
| 11 | ANALOG | NASA PDS | <https://pds.nasa.gov/?utm_source=%27chatgpt.com%27> | archive | NASA | PDS4 (varied) | None | PB | PD | 200* | 5 |
| 12 | FARMS | NASA POWER | <https://power.larc.nasa.gov/> | API + portal | NASA LaRC | JSON, CSV, NetCDF, ASCII | None | KB/point | CC0 | 200 | 5 |
| 13 | SAR | NISAR Data User Guide | <https://nisar-docs.asf.alaska.edu/> | docs | NASA / ISRO (guide: ASF) | HTML | None (EDL for data) | N/A | PD | 200 | 5 |
| 14 | FARMS | SMAP | <https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap> | dataset | NASA JPL/GSFC | HDF5 (L3/L4); GeoTIFF browse | EDL | granules ~10-100 MB; archive ~TB | CC0 | 200 | 5 |
| 15 | FARMS | VIIRS | <https://search.earthdata.nasa.gov/search?q=VIIRS> | dataset (search) | NASA / NOAA | HDF5, NetCDF, GeoTIFF | EDL | ~MBs-GBs/granule | CC0 / PD | 200 | 5 |
| 16 | ANALOG | Worldview (UTM) | <https://worldview.earthdata.nasa.gov/index.html?utm_source=%27chatgpt.com%27> | tool (UTM variant) | NASA ESDIS | web | None | N/A | CC0 | 200* | 5 |
| 17 | TREND | AppEEARS | <https://appeears.earthdatacloud.nasa.gov/> | tool + API | NASA LP DAAC | CSV, GeoTIFF, NetCDF | EDL | subset MBs | CC0 | 200 | 4 |
| 18 | FARMS | CropScape CDL | <https://nassgeodata.gmu.edu/CropScape/> | dataset + tool | USDA NASS | GeoTIFF (30 m) | CropSmart account (new 2026) | CONUS ~GBs | PD | 302→200 | 4 |
| 19 | ANALOG, SAR, TREND | CSA SAR Python tutorial | <https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial> | tutorial / repo | CSA | Python, QGIS | None | N/A | MIT | 200 | 4 |
| 20 | FARMS | ECOSTRESS | <https://ecostress.jpl.nasa.gov/data> | dataset + portal | NASA JPL | HDF5, GeoTIFF | EDL | ~50-150 MB/granule (est.) | CC0 | 200 | 4 |
| 21 | FARMS | ERA5 | <https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview> | dataset + API | ECMWF / C3S | NetCDF, GRIB | ACCT + CDS key | ~TB | CC-BY-4.0 | 200 | 4 |
| 22 | FARMS | GEDI | <https://gedi.umd.edu/data> | dataset | NASA / UMD | HDF5 | EDL | ~100 MB-1 GB/granule (est.) | CC0 | 200 | 4 |
| 23 | TREND | Giovanni | <https://giovanni.gsfc.nasa.gov/> | tool | NASA GES DISC | CSV, NetCDF, PNG | EDL (some) | N/A | CC0 | 200 | 4 |
| 24 | ANALOG | JAXA G-Portal | <https://gportal.jaxa.jp/gpr/index/index?utm_source=%27chatgpt.com%27> | portal | JAXA | GeoTIFF, HDF, NetCDF | ACCT | PB | CUSTOM (source indication) | 200 | 4 |
| 25 | ANALOG | LRO Diviner | <https://pds-geosciences.wustl.edu/missions/lro/diviner.htm?utm_source=%27chatgpt.com%27> | dataset | NASA / UCLA | PDS4, IMG, CSV | None | TB | PD | 200* | 4 |
| 26 | FARMS | NAIP | <https://naip-usdaonline.hub.arcgis.com/> | dataset | USDA | GeoTIFF (1 m) | None | CONUS ~TB | PD | 200 | 4 |
| 27 | FARMS | NLCD | <https://www.usgs.gov/centers/eros/science/national-land-cover-database> | dataset | USGS | GeoTIFF (30 m) | None | CONUS ~GBs | PD | 200 | 4 |
| 28 | TREND | NOAA CDO | <https://www.ncei.noaa.gov/cdo-web/> | API + portal | NOAA NCEI | JSON, CSV, XML | TOKEN | station data | PD | 200 | 4 |
| 29 | FARMS | OpenET | <https://openetdata.org> | dataset + API | OpenET (non-profit) | CSV, JSON, GeoTIFF | ACCT (key for bulk) | field-scale; ~TB CONUS | Custom; non-commercial, no derivatives (etdata.org/terms) | 200 | 4 |
| 30 | FARMS | PRISM | <https://prism.oregonstate.edu> | dataset | Oregon State Univ. | COG, GeoTIFF, NetCDF, BIL | None | CONUS ~TB | CUSTOM (attribution; commercial redistribution needs agreement) | 200 | 4 |
| 31 | FARMS | SRTM | <https://www.earthdata.nasa.gov/data/instruments/srtm> | dataset | NASA / USGS | GeoTIFF, HGT | EDL | ~25 MB per 1 deg tile (1 arc-sec) | PD | 200 | 4 |
| 32 | FARMS | SSURGO / STATSGO2 | <https://www.nrcs.usda.gov/resources/data-and-reports/soils> | dataset | USDA NRCS | FileGDB, CSV, GeoPackage | None (browser); blocked in this env | ~10s GB | PD | 000 | 4 |
| 33 | FARMS | USDA Ag Data Commons | <https://www.nal.usda.gov/services/agdatacommons> | portal | USDA NAL | CSV, GeoTIFF, NetCDF, PDF | None | per dataset | VARIES (often CC0/PD) | 200 | 4 |
| 34 | FARMS | USDA NASS QuickStats | <https://quickstats.nass.usda.gov> | API | USDA NASS | JSON, CSV, XML | KEY | <=50k rows/query | PD | 200 | 4 |
| 35 | FARMS | USGS NWIS | <https://waterdata.usgs.gov/nwis> | API + dataset | USGS | JSON, RDB, CSV | None | station KBs-MBs | PD | 200 | 4 |
| 36 | FARMS | Web Soil Survey | <https://websoilsurvey.nrcs.usda.gov/app/> | tool + dataset | USDA NRCS | HTML, PDF, GeoJSON, GeoTIFF | None | field-scale KBs-MBs | PD | 200 | 4 |
| 37 | FARMS | CoCoRaHS | <https://www.cocorahs.org/Maps> | dataset + network | CoCoRaHS (non-profit) | web, CSV | None (bulk by request) | station KBs | CUSTOM (attribution) | 200 | 3 |
| 38 | TREND | CSA SWOT | <https://www.asc-csa.gc.ca/eng/satellites/swot/> | info page | CSA | HTML | None | N/A | Copyright CSA | 200 | 3 |
| 39 | ANALOG | ESA Open Science Catalog | <https://opensciencedata.esa.int/?utm_source=%27chatgpt.com%27> | catalog | ESA | STAC JSON | None | metadata only | VARIES (per product) | 200* | 3 |
| 40 | FARMS | FAO GAEZ | <https://gaez.fao.org> | dataset | FAO / IIASA | GeoTIFF, tabular | None (accept terms) | global ~10s GB | CC-BY-NC-SA-3.0-IGO (reported; verify) | 200 | 3 |
| 41 | TREND | Geo.ca | <http://geo.ca/> | portal | NRCan (Canada) | varies | None | N/A | OGL-CA | 200 | 3 |
| 42 | TREND | Hydrology Time Series | <https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series> | tool | NASA GES DISC | CSV, plots | EDL | N/A | CC0 | 200 | 3 |
| 43 | SAR | Intro to SAR | <https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar> | tutorial | NASA Earthdata | HTML | None | N/A | PD | 200 | 3 |
| 44 | TREND | KNMI Climate Explorer | <https://climexp.knmi.nl/> | tool | KNMI (NL) | web, NetCDF | None / account | N/A | CUSTOM (attribution) | 200 | 3 |
| 45 | SAR | NISAR StoryMaps | <https://nisar.jpl.nasa.gov/applications/arcgis-storymaps/> | story / tool | NASA JPL | ArcGIS StoryMap | None | N/A | PD | 200 | 3 |
| 46 | FARMS | NLDAS / GLDAS | <https://www.earthdata.nasa.gov/> | portal (generic) | NASA GSFC | NetCDF, GRIB | EDL | ~100s MB/granule; ~TB archive | CC0 | 200 | 3 |
| 47 | ANALOG, SAR, TREND | RADARSAT Constellation (RCM) | <https://donnees-data.asc-csa.gc.ca/en/dataset/rcm> | dataset | CSA | GeoTIFF, TIFF | ACCT+LIC (EODMS) | ~TB | OGL-CA + product licence | 200 | 3 |
| 48 | ANALOG, SAR | RADARSAT-1 | <https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1> | dataset | CSA / NRCan | TIFF | ACCT (EODMS) / AWS | 36,500 images | OGL-CA | 200 | 3 |
| 49 | FARMS | USDA AMS Market News | <https://www.ams.usda.gov/market-news> | API + dataset | USDA AMS | CSV, JSON, XML | None / key for some | MBs | PD | 200 | 3 |
| 50 | FARMS | USFS LANDFIRE | <https://www.landfire.gov> | dataset | USFS / USGS | GeoTIFF | None | ~100s GB | PD | 200 | 3 |
| 51 | TREND | CSA ecosystem monitoring | <https://www.asc-csa.gc.ca/eng/satellites/everyday-lives/monitoring-and-protecting-our-ecosystems-from-space.asp> | info page | CSA | HTML | None | N/A | Copyright CSA | 200 | 2 |
| 52 | SAR | Intro to Remote Sensing | <https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/remote-sensing> | tutorial | NASA Earthdata | HTML | None | N/A | PD | 200 | 2 |
| 53 | SAR | NASA ARSET | <https://appliedsciences.nasa.gov/get-involved/training> | training | NASA Applied Sciences | HTML, video | None | N/A | PD | 200 | 2 |
| 54 | SAR | NISAR white papers | <https://nisar.jpl.nasa.gov/applications/societal-benefit/> | paper | NASA JPL | PDF | None | ~2 pp each | PD | 200 | 2 |
| 55 | TREND | NTRS SeaWiFS paper | <https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf> | paper | NASA NTRS | PDF | None | 2.2 MB | PD / NTRS terms | 200 | 2 |
| 56 | SAR | SAOCOM catalogue | <https://catalogos.conae.gov.ar/catalogo/catalogoSatSaocomInfo.html> | dataset / portal | CONAE (Argentina) | SAR L-band products | ACCT+AGR | ~TB | CUSTOM (agreement + licence) | 200 | 2 |
| 57 | SAR | SAOCOM registration | <https://www.argentina.gob.ar/noticias/la-informacion-saocom-cada-vez-mas-accesible> | article | Argentina.gob.ar | HTML | None | N/A | Government terms | 200 | 2 |
| 58 | TREND | Medium trend-test article | <https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b> | blog | Medium (non-gov) | HTML | None | N/A | Copyright author | 403 | 1 |
| 59 | TREND | Statsig significance guide | <https://www.statsig.com/perspectives/a-comprehensive-guide-to-statistical-significance> | blog | Statsig (non-gov) | HTML | None | N/A | Copyright Statsig | 200 | 1 |
| 60 | SAR | UAVSAR Postcards | <https://uavsar.jpl.nasa.gov/education/postcards.html> | gallery | NASA JPL | JPEG | None | N/A | PD | 200 | 1 |

### Part B — Moon, Mars, planetary archives and deep-space hardware (23 URLs)

| # | Challenge(s) | Resource | URL | Type | Provider | Format | Access / auth | Size | License / terms | HTTP | U |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 61 | LUNAR | JPL Horizons | <https://ssd.jpl.nasa.gov/horizons/> | API + tool | NASA JPL | text, JSON | None | KBs | PD | 200 | 5 |
| 62 | JUNIOR, MARS | Mars Trek | <https://trek.nasa.gov/mars/> | tool + API | NASA JPL | ArcGIS REST, GeoTIFF/PNG, JSON | None | PB | PD | 200 | 5 |
| 63 | LUNAR | Moon Trek | <https://trek.nasa.gov/moon/> | tool + API | NASA JPL | ArcGIS REST, tiles, GeoJSON | None | PB | PD | 200 | 5 |
| 64 | MARS | NASA Worldview | <https://worldview.earthdata.nasa.gov/> | tool | NASA ESDIS | web + permalink params + GIBS | None | N/A | CC0 | 200 | 5 |
| 65 | LUNAR | Lunar Quickmap | <https://quickmap.lroc.asu.edu/> | tool | ASU / NASA | web, WMS | None | N/A | PD | 200 | 4 |
| 66 | RELIC | NSSDCA | <https://nssdc.gsfc.nasa.gov/> | archive | NASA GSFC | HTML | None | N/A | PD | 200 | 4 |
| 67 | MARS | Perseverance raw images | <https://mars.nasa.gov/mars2020/multimedia/raw-images/> | gallery | NASA JPL | JPEG, PNG | None | >1M images; ~TB | PD | 200 | 4 |
| 68 | MARS | USGS Planetary Geologic Mapping | <https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars> | tool / data | USGS Astrogeology | web, GeoTIFF | None | N/A | PD | 200 | 4 |
| 69 | RELIC | ALSEP | <https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C> | archive record | NASA NSSDCA | HTML | None | N/A | PD | 200 | 2 |
| 70 | RELIC | Apollo Lunar Modules | <https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C> | archive record | NASA NSSDCA | HTML | None | N/A | PD | 200 | 2 |
| 71 | LUNAR | CSA Moon Exploration | <https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/> | portal | CSA | HTML | None | N/A | Copyright CSA | 200 | 2 |
| 72 | MARS | Curiosity route map | <https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/> | video / image | NASA JPL | MP4, JPEG | None | N/A | PD | 200 | 2 |
| 73 | RELIC | Dawn | <https://science.nasa.gov/mission/dawn/> | mission page | NASA | HTML | None | N/A | PD | 200 | 2 |
| 74 | RELIC | Ingenuity | <https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/> | mission page | NASA | HTML | None | N/A | PD | 200 | 2 |
| 75 | RELIC | Kepler | <https://science.nasa.gov/mission/kepler/> | mission page | NASA | HTML | None | N/A | PD | 200 | 2 |
| 76 | RELIC | Lunar Roving Vehicles | <https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C> | archive record | NASA NSSDCA | HTML | None | N/A | PD | 200 | 2 |
| 77 | RELIC | NEAR Shoemaker | <https://science.nasa.gov/mission/near-shoemaker/> | mission page | NASA | HTML | None | N/A | PD | 200 | 2 |
| 78 | RELIC | Phoenix & InSight | <https://science.nasa.gov/mission/insight/> | mission page | NASA | HTML | None | N/A | PD | 200 | 2 |
| 79 | RELIC | Pioneer 10 & 11 | <https://science.nasa.gov/mission/pioneer-10/> | mission page | NASA | HTML | None | N/A | PD | 200 | 2 |
| 80 | RELIC | Sojourner | <https://science.nasa.gov/mission/mars-pathfinder/> | mission page | NASA | HTML | None | N/A | PD | 200 | 2 |
| 81 | RELIC | Spirit & Opportunity | <https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/> | mission page | NASA | HTML | None | N/A | PD | 200 | 2 |
| 82 | RELIC | Surveyor | <https://science.nasa.gov/mission/surveyor-3/> | mission page | NASA | HTML | None | N/A | PD | 200 | 2 |
| 83 | RELIC | Viking 1 & 2 | <https://science.nasa.gov/mission/viking-1/> | mission page | NASA | HTML | None | N/A | PD | 200 | 2 |

### Part C — Human health, combustion, games, astronomy, storytelling and sonification (50 URLs)

| # | Challenge(s) | Resource | URL | Type | Provider | Format | Access / auth | Size | License / terms | HTTP | U |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 84 | JUNIOR | DONKI | <https://ccmc.gsfc.nasa.gov/tools/DONKI/> | API | NASA CCMC | JSON | KEY | KBs | PD | 200 | 5 |
| 85 | JUKE | EIC content gallery | <https://svs.gsfc.nasa.gov/gallery/earth-information-center/> | visualization | NASA SVS | MP4, PNG, TIFF | None | GBs | PD | 200 | 5 |
| 86 | SPHEREX | IRSA / SPHEREx | <https://irsa.ipac.caltech.edu/Missions/spherex.html> | archive | NASA / IPAC (Caltech) | FITS | None | ~TB | PD / Caltech terms | 200 | 5 |
| 87 | JUNIOR | NASA Open APIs | <https://api.nasa.gov/> | API portal | NASA | JSON | KEY | KBs | PD | 200 | 5 |
| 88 | JUKE | Air quality model runs | <https://svs.gsfc.nasa.gov/5533/> | visualization | NASA SVS | PNG frames | None | MBs-GBs | PD | 200 | 4 |
| 89 | JUKE | Atmospheric river 3D | <https://svs.gsfc.nasa.gov/4960/> | visualization | NASA SVS | MP4, PNG | None | MBs | PD | 200 | 4 |
| 90 | JUKE | DYAMOND CO2 | <https://svs.gsfc.nasa.gov/5196/> | visualization | NASA SVS | MP4, PNG | None | MBs | PD | 200 | 4 |
| 91 | SPHEREX | Gaia archive | <https://archive.stsci.edu/missions-and-data/gaia> | archive | ESA / NASA MAST | FITS, CSV, VOTable (TAP) | None | ~TB | CC-BY-NC-3.0-IGO | 200 | 4 |
| 92 | JUKE | GEDI forest height | <https://svs.gsfc.nasa.gov/4950/> | visualization | NASA SVS | MP4, PNG | None | MBs | PD | 200 | 4 |
| 93 | JUKE | GEOS aerosols | <https://svs.gsfc.nasa.gov/5669/> | visualization | NASA SVS | MP4, PNG | None | MBs | PD | 200 | 4 |
| 94 | GAME | GMAT | <https://software.nasa.gov/software/GSC-19468-1> | software | NASA GSFC | Windows/Linux application | None | ~1 GB | Apache-2.0 | 200 | 4 |
| 95 | JUKE | Lightning from ISS | <https://svs.gsfc.nasa.gov/5011/> | visualization | NASA SVS | MP4, PNG | None | MBs | PD | 200 | 4 |
| 96 | JUNIOR | NASA OSDR | <https://osdr.nasa.gov/bio/repo/> | repository + API | NASA | JSON, CSV, omics files | None (some controlled) | ~TB | CC0 / no restrictions | 200 | 4 |
| 97 | FLAME | NASA PSI | <https://psi.nasa.gov/physci/repo/search?q=combustion> | repository | NASA | CSV, XLSX, images, video, PDF | GUEST (download) | ~TB | PD / terms | 200 | 4 |
| 98 | JUKE | Night lights 2012-2023 | <https://svs.gsfc.nasa.gov/5313/> | visualization | NASA SVS | MP4, PNG, TIFF | None | MBs | PD | 200 | 4 |
| 99 | JUNIOR | OSDR search API | <https://osdr.nasa.gov/osdr/data/search?term=KEYWORD> | API | NASA | JSON | None | KBs | CC0 | 200 | 4 |
| 100 | JUKE | Perpetual Ocean 2 | <https://svs.gsfc.nasa.gov/5425/> | visualization | NASA SVS | MP4, PNG | None | MBs | PD | 200 | 4 |
| 101 | JUKE | Sea surface currents | <https://svs.gsfc.nasa.gov/3912/#media_group_349716> | visualization | NASA SVS | MP4, PNG | None | MBs | PD | 200 | 4 |
| 102 | SPHEREX | SPHEREx notebooks | <https://caltech-ipac.github.io/irsa-tutorials/spherex/> | tutorial / repo | Caltech / IPAC | Jupyter | None | N/A | BSD-3-Clause | 200 | 4 |
| 103 | SPHEREX | CADC | <https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/> | archive | NRC Canada | FITS | ACCT (some anon) | TB | VARIES | 200 | 3 |
| 104 | HEALTH | CSA radiation monitoring | <https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp> | article | CSA | HTML | None | N/A | Copyright CSA | 200 | 3 |
| 105 | GAME | CubeSat 101 | <https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf> | paper | NASA CSLI | PDF | None | MBs | PD | 200 | 3 |
| 106 | HEALTH | HRP: 5 hazards | <https://www.nasa.gov/hrp/hazards/> | article | NASA HRP | HTML | None | N/A | PD | 200 | 3 |
| 107 | HEALTH | HRP: risks | <https://www.nasa.gov/hrp/risks/> | article | NASA HRP | HTML | None | N/A | PD | 200 | 3 |
| 108 | GAME | NASA Mission Viz | <https://nasa.github.io/mission-viz/> | web tool | NASA | web/JS | None | N/A | NONE DECLARED | 200 | 3 |
| 109 | SPHEREX | NEOSSat dataset | <https://data.asc-csa.gc.ca/dataset/neossat> | dataset | CSA | FITS | None | GBs | OGL-CA | 200 | 3 |
| 110 | SPHEREX | WiseView | <http://byw.tools/wiseview> | tool | backyardworlds (non-gov) | web | None | N/A | CUSTOM | 200 | 3 |
| 111 | FLAME | Apollo 1 | <https://sma.nasa.gov/sma-disciplines/accllp/apollo-1> | article | NASA SMA | HTML | None | N/A | PD | 200 | 2 |
| 112 | FLAME | Apollo 13 | <https://sma.nasa.gov/sma-disciplines/accllp/apollo-13> | article | NASA SMA | HTML | None | N/A | PD | 200 | 2 |
| 113 | GAME | Concept Maturity Levels | <https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299> | paper | NASA JPL / Caltech | PDF | None | N/A | Caltech/NTRS terms | 200 | 2 |
| 114 | GAME | CSA digital games | <https://www.asc-csa.gc.ca/eng/youth-educators/digital-games-and-activities.asp> | portal | CSA | HTML | None | N/A | Copyright CSA | 200 | 2 |
| 115 | JUNIOR | CSA food production | <https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/> | toolkit | CSA | HTML | None | N/A | Copyright CSA | 200 | 2 |
| 116 | SPHEREX | CSA NEOSSat | <https://www.asc-csa.gc.ca/eng/satellites/neossat/> | info page | CSA | HTML | None | N/A | Copyright CSA | 200 | 2 |
| 117 | JUNIOR | CSA STEM resources | <https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp> | portal | CSA | HTML | None | N/A | Copyright CSA | 200 | 2 |
| 118 | HEALTH | CSA: why space experiments | <https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp> | article | CSA | HTML | None | N/A | Copyright CSA | 200 | 2 |
| 119 | GAME | Design & Develop Science Missions | <https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf?emrc=a454cf> | paper | NASA | PDF | None | MBs | PD | 200 | 2 |
| 120 | HEALTH | HRP: ongoing research | <https://www.nasa.gov/hrp/ongoing-hrp-research/> | article | NASA HRP | HTML | None | N/A | PD | 200 | 2 |
| 121 | FLAME | Mir fire (25 years) | <https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/> | article | NASA History | HTML | None | N/A | PD | 200 | 2 |
| 122 | GAME | Mission Design Lab | <https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/> | info page | NASA GSFC | HTML | None | N/A | PD | 200 | 2 |
| 123 | FLAME | NASA Combustion Science | <https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/> | info page | NASA Glenn | HTML | None | N/A | PD | 200 | 2 |
| 124 | SPHEREX | NEOSSat tutorial | <https://github.com/asc-csa/NEOSSAT_Tutorial> | tutorial / repo | CSA | Python | None | N/A | MIT | 200 | 2 |
| 125 | JUNIOR | RadLab | <https://visualization.osdr.nasa.gov/radlab/gui/data-api/> | tool / API | NASA OSDR | JSON, CSV, TSV, HTML | None | MBs | PD | 500 | 2 |
| 126 | FLAME | Researcher's Guide to ISS Combustion | <https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/> | paper | NASA ISS Program | PDF | None | 50+ pp | PD | 200 | 2 |
| 127 | JUKE | Sonification: Caldwell 73 | <https://svs.gsfc.nasa.gov/13786/> | visualization | NASA SVS | MP4, PNG | None | MBs | PD | 200 | 2 |
| 128 | GAME | Webb telescope game | <https://science.nasa.gov/mission/webb/game-build-it-yourself/> | game | NASA / STScI | web | None | N/A | PD | 200 | 2 |
| 129 | FLAME | NASA ScienceCasts video | <https://www.youtube.com/watch?v=W1oXykoz9zg> | video | NASA | MP4 stream | None | 3.6 min | PD | 200 | 1 |
| 130 | GAME | Space Apps 2023 VR challenge | <https://www.spaceappschallenge.org/2023/challenges/visualize-a-space-mission-using-virtual-reality/> | webpage | NASA Space Apps | HTML | None | N/A | PD | 200 | 1 |
| 131 | FLAME | Spinoff: fire attire | <https://spinoff.nasa.gov/node/9918> | article | NASA Spinoff | HTML | None | N/A | PD | 200 | 1 |
| 132 | FLAME | Spinoff: fire detector | <https://spinoff.nasa.gov/node/9407> | article | NASA Spinoff | HTML | None | N/A | PD | 200 | 1 |
| 133 | FLAME | Spinoff: firefighter air tanks | <https://spinoff.nasa.gov/node/9582> | article | NASA Spinoff | HTML | None | N/A | PD | 200 | 1 |


**Catalog footnotes**

1. **Eight ANALOG URLs carry `?utm_source=%27chatgpt.com%27`** — scraping residue from the challenge curation. They work, but strip the parameter from any submitted README: Earthdata Search, Worldview, PDS, LRO PDS, Diviner, Copernicus Data Space, ESA Open Science Catalog and JAXA G-Portal. Three of these duplicate clean URLs.
2. **Row 46 (NLDAS/GLDAS)** is not a dataset link — it points at the Earthdata home page. This is the worst single link in the FARMS list; see §5.
3. **RadLab** is the only hard 500 in the catalog. The GUI is down; the data API still answers **with query parameters** (e.g. `https://visualization.osdr.nasa.gov/radlab/api/?spacecraft=ISS&instrument=REM&limit=1` → 200). See §5 for the replacement.
4. **CropScape** now returns `302` to `cat.csiss.gmu.edu/CropSmart/signin`, so the “no auth” assumption is no longer true. Use the NASS CDL release page or a CropSmart account.
5. **NRCS** (`nrcs.usda.gov`) connects but never responds in this environment (Akamai edge). It works in a normal browser. For programmatic soils, use Web Soil Survey or the Soil Data Access API.
6. **NSSDCA and mission pages (rows 66–83)** are HTML records, not bulk data. Excellent for narrative work, useless for quantitative analysis.
7. **SVS/EIC rows** are visualizations (MP4/PNG/TIFF), not the underlying science data. For the Jukebox that is exactly right; for analysis you must go to the mission product.
8. **Mars Trek, Moon Trek, Worldview, Earthdata Search, AppEEARS, Giovanni, PSI, OSDR, ESA OSC and Lunar Quickmap** are JavaScript apps. Their HTML is a shell; use their APIs/tiles (see §3) or a browser.

---

## 2. Cross-challenge reuse

### 2.1 What is actually shared today

Only four URLs are cited by more than one challenge:

| Resource | Challenges | Why it is shared | Reuse pattern |
|---|---|---|---|
| CSA **RCM** data | SAR, TREND, ANALOG | CSA is the only partner agency with a SAR archive linked from three different angles | Same portal, three different asks (change detection, time series, analog context) |
| CSA **SAR Python tutorial** | SAR, TREND, ANALOG | It is the only end-to-end SAR reading recipe in the whole set | Copy the environment, not just the link |
| **RADARSAT-1** | SAR, ANALOG | Open-licence historical SAR (36,500 images) | Good for a “before/after” story where NISAR has no baseline |
| **Mars Trek** | MARS, JUNIOR | Same tile/REST service used as a map and as a game backdrop | One tile client, two products |

Everything else is single-use. That is a design weakness of the official resource lists, not of the data.

### 2.2 Shared infrastructure the challenges should be reusing

These are not (or barely) in the resource lists, but they are the highest-leverage shared services for a 48-hour build:

| Service | What it gives you | Challenges it would help | Access | Licence |
|---|---|---|---|---|
| **NASA CMR + CMR STAC** (`cmr.earthdata.nasa.gov/stac/`) | One search API over every DAAC; STAC items for cloud-native collections | Every Earth challenge (FARMS, SAR, TREND, FIRMS, ANALOG, JUKE) | None | CC0 |
| **`earthaccess`** (Python) | Earthdata login, CMR search, direct S3/HTTPS open, no per-DAAC glue | Every Earth challenge | EDL | MIT |
| **GIBS** (`gibs.earthdata.nasa.gov`) | WMTS/WMS/XYZ tiles of nearly every NASA imagery layer, no key, no login | FARMS, FIRMS, TREND, JUKE, ANALOG; already the engine behind Worldview | None | CC0 + acknowledgement |
| **Worldview** | Human-facing browse + URL-parameter permalinks; fastest way to grab a dated image | FARMS, FIRMS, TREND, JUKE | None | CC0 |
| **NASA POWER API** | Point time series of meteorology/agroclimatology, JSON/CSV, no key | FARMS, TREND, FIRMS, JUKE | None | CC0 |
| **FIRMS API** | Near-real-time and standard-processing hotspots, CSV, 20+ years | FIRMS, FARMS (burn), TREND, SAR (fire scars) | MAP_KEY | CC0 |
| **DONKI** | Solar flares, CMEs, SEPs, radiation storms — JSON | JUNIOR, HEALTH (radiation), LUNAR (space weather), GAME | KEY | PD |
| **images.nasa.gov API** | NASA Image and Video Library, JSON metadata + asset links | RELIC, MARS, JUKE, GAME, JUNIOR | None | PD + media guidelines |
| **NASA SVS** | Broadcast-ready frames, MP4, PNG, TIFF, with metadata | JUKE, RELIC, any explainer video | None | PD |
| **PDS / NSSDCA** | Planetary and mission archive, PDS4 labels | LUNAR, MARS, RELIC, ANALOG | None | PD |
| **JPL Horizons API** | Ephemerides for any body/observer, text/JSON | LUNAR, MARS, GAME | None | PD |
| **OSDR + RadLab API** | Space biology and radiation telemetry | HEALTH, JUNIOR | None (some controlled) | CC0/no restrictions |
| **PSI** | Microgravity physical-science data | FLAME (core), GAME (engineering realism) | GUEST | PD/terms |
| **IRSA / SPHEREx / Gaia** | Infrared and astrometric archives, FITS, TAP | SPHEREX, RELIC (deep-space artifacts) | None | PD / CC BY-NC |
| **NASA Trek REST** | Moon/Mars DEM and image services, elevation profiles, sun angles, slope, crater/rock detection | MARS, LUNAR, JUNIOR, ANALOG | None | PD |

### 2.3 Reuse matrix

`●` = listed in the challenge resources; `○` = not listed but strongly recommended; blank = low value.

| Challenge | EDL/CMR | GIBS/Worldview | Trek | POWER | FIRMS | DONKI | images.nasa | SVS | PDS/NSSDCA | Horizons | OSDR/PSI | IRSA |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FARMS | ● | ○ |  | ● | ○ |  | ○ | ○ |  |  |  |  |
| SAR | ● | ○ |  |  | ○ |  | ○ | ○ |  |  |  |  |
| TREND | ● | ○ |  | ○ | ○ |  | ○ | ○ |  |  |  |  |
| FLAME |  |  |  |  |  |  | ○ | ○ |  |  | ● |  |
| HEALTH |  |  |  |  |  | ○ | ○ | ○ |  |  | ○ |  |
| MARS |  | ● | ● |  |  | ○ | ○ | ○ | ○ | ○ |  |  |
| JUNIOR |  |  | ● |  |  | ● | ○ | ○ |  |  | ● |  |
| LUNAR |  |  | ● |  |  | ○ | ○ | ○ | ○ | ● |  |  |
| FIRMS | ● | ○ |  |  | ● |  | ○ | ○ |  |  |  |  |
| RELIC |  |  |  |  |  |  | ○ | ○ | ● | ○ |  | ○ |
| ANALOG | ● | ● | ○ | ○ | ○ |  | ○ | ○ | ● |  |  |  |
| SPHEREX |  |  |  |  |  |  | ○ | ○ |  |  |  | ● |
| GAME |  |  |  |  |  | ○ | ○ | ○ |  | ● | ○ |  |
| JUKE |  | ○ |  | ○ | ○ |  | ○ | ● |  |  |  |  |

The pattern is stark: the **Earth** challenges get a rich but fragmented list; the **space** challenges get narrative links and almost no machine-readable data. The biggest cross-cutting win is to standardise on one access layer (CMR/STAC + `earthaccess` + GIBS) and one visual layer (Leaflet/deck.gl over WMTS tiles).

### 2.4 Reuse combinations worth building once

1. **One tile client** (Leaflet + GIBS WMTS + Trek ArcGIS REST) serves FARMS, FIRMS, TREND, MARS, LUNAR, ANALOG. Swap the layer IDs, not the code.
2. **One time-series engine** (CMR search → `earthaccess.open` → xarray → Mann–Kendall) serves TREND, FARMS, FIRMS, JUKE.
3. **One “dated image” helper** (GIBS `default/{date}/...` tiles, or Worldview permalink URLs) serves every Earth demo and every dither hero image.
4. **One ephemeris helper** (Horizons API) serves LUNAR, MARS and GAME.
5. **One asset pipeline** (images.nasa.gov + SVS + PDS) serves RELIC, MARS, JUKE, GAME.
6. **One FITS cutout helper** (IRSA TAP + `astropy`) serves SPHEREX; the same pattern works for NEOSSat and CADC.

---

## 3. Fast-start kit

### 3.1 Accounts and keys to register before the hackathon

Register P0 tonight. P1 takes another 20 minutes. P2 is optional or has a long lead time.

| Priority | Service | URL | What you get | Time | Notes |
|---|---|---|---|---|---|
| **P0** | NASA Earthdata Login | https://urs.earthdata.nasa.gov/users/new | Access to every DAAC, AppEEARS, Giovanni, ASF, Worldview downloads | 5 min | One account covers EOSDIS |
| **P0** | NASA API key | https://api.nasa.gov/ | 1,000 req/h across APOD, DONKI, Mars Rover Photos, EPIC, etc. | 2 min | `DEMO_KEY` is 30/h and 50/day per IP — do not demo on it |
| **P0** | FIRMS MAP_KEY | https://firms.modaps.eosdis.nasa.gov/api/map_key/ | Hotspot API + map services | 2 min | 5,000 transactions / 10 min; one query covers at most 5 days |
| **P0** | Copernicus Data Space | https://dataspace.copernicus.eu | Sentinel-1/2/3/5P, S3 access | 5 min | Accept the Sentinel legal notice |
| **P0** | Copernicus CDS | https://cds.climate.copernicus.eu/profile | ERA5 and C3S data + API key | 5 min | Accept the ERA5 licence; copy key from `/how-to-api` |
| **P1** | ASF (same Earthdata login) | https://search.asf.alaska.edu/ | NISAR, Sentinel-1, RADARSAT, UAVSAR | 2 min | Authorize the ASF app in your Earthdata profile |
| **P1** | JAXA G-Portal | https://www.gportal.jaxa.jp/?lang=en | GPM/GSMaP, GCOM, ALOS, EarthCARE | 10 min | Free; source indication required; commercial use needs prior notice |
| **P1** | NASA PSI / NASA Guest Account | https://guest.nasa.gov/ then https://psi.nasa.gov/physci/workspace-sso-login.html | Combustion and physical-science data | 10 min–24 h | Login-gated; plan to download before the clock starts |
| **P1** | USDA QuickStats | https://quickstats.nass.usda.gov/api | County/state agricultural statistics | 2 min | API key emailed; 50k rows/query cap |
| **P1** | NOAA CDO | https://www.ncei.noaa.gov/cdo-web/token | Station climate data | 2 min | Token required; the API returns 400 without it |
| **P1** | USGS ERS | https://ers.cr.usgs.gov/register | Landsat, NAIP, NLCD downloads | 10 min | EarthExplorer needs this |
| **P2** | CSA EODMS | https://eodms-sgdot.nrcan-rncan.gc.ca | RCM, RADARSAT-1 | 10 min | Some app paths return 403 to curl (root 200, `/welcome` 403) but work in a browser |
| **P2** | CADC | https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/ | Canadian astronomy archive | 10 min | Many collections are anonymous |
| **P2** | OpenET | https://etdata.org | Field-scale ET | 5 min | API key for bulk; website terms are non-commercial |
| **P2** | CONAE SAOCOM | https://catalogos.conae.gov.ar/catalogo/catalogoSatSaocomInfo.html | L-band SAR | days–weeks | Requires registration, a **Convenio** and a signed licence — **do not depend on it** |
| **P2** | OSDR controlled access | https://osdr.nasa.gov/bio/repo/ | Some human sequence data | days | Most OSDR data needs no auth |

#### P0 steps in detail

**A. Earthdata Login (the one account you cannot skip)**

1. Register at https://urs.earthdata.nasa.gov/users/new with an institutional email.
2. Verify the email, then sign in at https://urs.earthdata.nasa.gov/profile.
3. Open **Applications → Authorized Apps** and approve the DAAC apps you will use (commonly GES DISC, LP DAAC, NSIDC, ASF, PO.DAAC, ORNL DAAC, LAADS, AppEEARS; display names vary).
4. Create `~/.netrc` with one line and `chmod 600`:
   `machine urs.earthdata.nasa.gov login YOUR_USER password YOUR_PASS`
5. Test with a small LP DAAC or GES DISC granule. If the download redirects to a login page, the app authorization is missing.

**B. NASA API key**

1. Go to https://api.nasa.gov/.
2. Enter first name, last name and email. The key is shown immediately and emailed.
3. Pass it as `?api_key=...` or `X-Api-Key: ...`.
4. Budget: **1,000 requests/hour** per key; the shared `DEMO_KEY` is **30/hour and 50/day per IP** (verified at https://api.nasa.gov/). Cache every response; do not call DONKI per animation frame.

**C. FIRMS MAP_KEY**

1. Go to https://firms.modaps.eosdis.nasa.gov/api/map_key/.
2. Enter email; the key arrives by email.
3. Use `/api/area/csv/[MAP_KEY]/[SOURCE]/[W,S,E,N]/[DAYS]/[DATE]`.
4. Source IDs: `MODIS_NRT`, `MODIS_SP`, `VIIRS_SNPP_NRT`, `VIIRS_SNPP_SP`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA20_SP`, `VIIRS_NOAA21_NRT`, `VIIRS_NOAA21_SP`, `LANDSAT_NRT`.
5. The limit is **5,000 transactions / 10 minutes**; a request may cover **1–5 days**. A 20-year harmonization needs the bulk archive, not the area API.

**D. Copernicus Data Space**

1. Register at https://dataspace.copernicus.eu.
2. Accept the Sentinel Data Legal Notice (linked from https://dataspace.copernicus.eu/terms-and-conditions).
3. Use the browser or the OData/S3 APIs; create S3 credentials in the dashboard for bulk.
4. Attribution: `Contains modified Copernicus Sentinel data [year]`.

**E. CDS / ERA5**

1. Sign in or create an account from https://cds.climate.copernicus.eu/profile.
2. Accept the ERA5 dataset licence on the dataset page.
3. Copy the API key from https://cds.climate.copernicus.eu/how-to-api.
4. Put `url` and `key` in `~/.cdsapirc`.
5. ERA5 is CC BY 4.0, but the C3S attribution + disclaimer are mandatory.

**F. No account needed: SPHEREx S3, Trek, GIBS, CMR, Horizons**

- SPHEREx DR1 is browsable anonymously in **`s3://nasa-irsa-spherex`** (AWS `us-east-1`; `--no-sign-request`). Verified listing 200.
- Mars/Moon Trek exposes **ArcGIS ImageServer REST** and a tile catalogue at `https://trek.nasa.gov/tiles/{Moon|Mars}/rasters/{eq|np|sp}/list.json`. No key.
- GIBS WMTS capabilities: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml`. No key.
- CMR: `https://cmr.earthdata.nasa.gov/search/`; CMR STAC: `https://cmr.earthdata.nasa.gov/stac/`. No key.
- Horizons: `https://ssd.jpl.nasa.gov/api/horizons.api?...`. No key.
- images.nasa.gov: `https://images-api.nasa.gov/search?q=...`. No key.

### 3.2 Python / JavaScript libraries

All versions and licences below were verified from PyPI, npm or the repository `LICENSE` file on 2026-11-14.

| Library | Version | Licence | Use in these challenges | Install |
|---|---|---|---|---|
| `earthaccess` | 0.19.0 | **MIT** | Earthdata login, CMR search, HTTPS/S3 open | `pip install earthaccess` |
| `pystac-client` | 0.9.1 | **Apache-2.0** | STAC search (CMR STAC, ESA OSC) | `pip install pystac-client` |
| `rasterio` | 1.5.2 | **BSD-3-Clause** | COG/GeoTIFF reads, windowed reads | `pip install rasterio` |
| `rioxarray` | 0.24.0 | **Apache-2.0** | Raster + xarray | `pip install rioxarray` |
| `xarray` | 2026.9.0 | **Apache-2.0** | NetCDF/HDF5/Zarr labelled arrays | `pip install xarray` |
| `stackstac` | 0.5.1 | **MIT** | STAC → xarray/Dask cubes | `pip install stackstac` |
| `titiler.core` | 2.4.0 | **MIT** | COG tile server (FastAPI) | `pip install titiler.core` |
| `asf_search` | 14.1.0 | **BSD-3-Clause** | NISAR/Sentinel-1 search + download | `pip install asf_search` |
| `h5py` | 3.16.0 | **BSD-3-Clause** | HDF5: NISAR, GEDI, SMAP | `pip install h5py` |
| `netCDF4` | 1.7.5.1 | **MIT** | NetCDF: GPM, NLDAS/GLDAS, ERA5 | `pip install netCDF4` |
| `astropy` | 8.0.2 | **BSD-3-Clause** | FITS: SPHEREx, Gaia, NEOSSat | `pip install astropy` |
| `zarr` | 3.4.2 | **MIT** | Chunked N-D arrays | `pip install zarr` |
| `numpy` | 2.5.4 | **BSD-3-Clause** | Numerics | `pip install numpy` |
| `pandas` | 3.1.1 | **BSD-3-Clause** | Tabular: FIRMS, QuickStats, PSI | `pip install pandas` |
| `geopandas` | 1.2.0 | **BSD-3-Clause** | Vector: fire perimeters, soil maps | `pip install geopandas` |
| `dask` | 2026.8.0 | **BSD-3-Clause** | Chunked/parallel reads | `pip install dask` |
| `pymannkendall` | 1.4.3 | **MIT** | Mann–Kendall trend test | `pip install pymannkendall` |
| `matplotlib` | current | **PSF-based** | Static charts | `pip install matplotlib` |
| `GDAL` | system | **MIT/X11** | Format swiss-army knife | `brew install gdal` |
| `Leaflet` | 1.9.4 | **BSD-2-Clause** | GIBS/Trek maps | `npm i leaflet` |
| `deck.gl` | 9.4.1 | **MIT** | GPU scatter/heatmap of hotspots | `npm i deck.gl` |
| `three` | 0.187.0 | **MIT** | 3D Moon/Mars/space scenes | `npm i three` |
| `maplibre-gl` | 6.18.0 | **BSD-3-Clause** | Vector/raster maps, PMTiles | `npm i maplibre-gl` |
| `pmtiles` | 4.5.0 | **BSD-3-Clause** | Single-file tiled basemaps | `npm i pmtiles` |
| `tone` | 15.1.22 | **MIT** | Jukebox synthesis | `npm i tone` |
| `d3` | 7.9.2 | **ISC** | Charts and scales | `npm i d3` |
| `h3-js` | 4.5.0 | **Apache-2.0** | Hexagonal binning for hotspots | `npm i h3-js` |
| `@google/genai` | 3.3.0 | **Apache-2.0** | Gemini API (JS) | `npm i @google/genai` |
| `google-genai` | current | **Apache-2.0** | Gemini API (Python) | `pip install google-genai` |
| `ffmpeg` | system | **LGPL-2.1+ / GPL** (build-dependent) | Frame extraction, audio encode | `brew install ffmpeg` |

**NASA APIs with no SDK required**

- **GIBS**: WMTS/WMS/TWMS/XYZ at `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/...`; no key; CC0 with the GIBS acknowledgement. A tile test returned `200 image/jpeg` (17.8 KB).
- **Trek**: U.S. public domain; ArcGIS ImageServer `exportImage` works, e.g. `https://trek.nasa.gov/mars/trekarcgis/rest/services/Gale_DEM_SMG_1m/ImageServer/exportImage?bbox=...&size=512,512&format=png&f=image` (verified 200 PNG). Moon exposes **279 ArcGIS services** (DEMs, Apollo paths/waypoints, CLPS sites); Mars exposes 7 high-resolution DEM ImageServers plus the global MOLA service. Tile catalogue: `https://trek.nasa.gov/tiles/{Body}/rasters/{eq|np|sp}/list.json`.
- **Worldview**: URL parameters (`?v=lon,lat,zoom&t=YYYY-MM-DD&l=LAYER`); no key. There is no stable public snapshot API at `/api/v1/snapshot` (returns 404 HTML); use GIBS for programmatic images.
- **Horizons**: `https://ssd.jpl.nasa.gov/api/horizons.api?...`; text or JSON; no key.
- **CMR**: `https://cmr.earthdata.nasa.gov/search/`; no key.
- **CMR STAC**: `https://cmr.earthdata.nasa.gov/stac/`; no key.
- **images.nasa.gov**: `https://images-api.nasa.gov/search?q=...`; no key.
- **POWER**: `https://power.larc.nasa.gov/api/temporal/daily/point?...&format=JSON`; no key.
- **OSDR search**: `https://osdr.nasa.gov/osdr/data/search?term=...`; returns JSON; no key for public studies.
- **IRSA TAP**: `https://irsa.ipac.caltech.edu/TAP`; ADQL; no key for public tables.

### 3.3 Cloud-native formats

| Format | What it is | Where it appears in these challenges | Read/write with | 48-hour gotcha |
|---|---|---|---|---|
| **COG** (Cloud Optimized GeoTIFF) | GeoTIFF with internal tiling + overviews, HTTP range-readable | Landsat, Sentinel-2, PRISM, NAIP, NLCD | `rasterio`, GDAL, `titiler` | Always read windows, never the whole scene |
| **Zarr** | Chunked N-D arrays, cloud-friendly | Climate/model cubes, custom derived stacks | `xarray`, `zarr` | v2 vs v3 mismatch; pin versions |
| **NetCDF4 / HDF5** | Self-describing array container | GPM, SMAP, NISAR, GEDI, MERRA-2, ERA5 | `xarray`, `h5py`, `netCDF4` | Not cloud-optimized; subset or use kerchunk |
| **ICEchunk** | Transactional Zarr store | New derived cubes | `icechunk`, `xarray` | Newer; fewer examples |
| **STAC** | JSON metadata catalog for assets | CMR STAC, ESA Open Science Catalog | `pystac-client` | A STAC item is metadata, not data |
| **GeoParquet** | Columnar geospatial table | Hotspots, station tables, statistics | `geopandas`, `pyarrow` | Great for FIRMS-scale point tables |
| **FlatGeobuf** | Streamable vector format | Boundaries, perimeters | GDAL, `geopandas` | Less tooling than GeoParquet |
| **PMTiles** | Single-file tiled basemap | Dither basemap for web maps | `pmtiles`, MapLibre | Needs a JS loader |
| **FITS** | Astronomy multi-extension images/cubes | SPHEREx, Gaia, NEOSSat | `astropy` | SPHEREx MEF cubes are large; cut out first |
| **PDS4 / IMG** | Planetary labeled products | LRO, MOLA, HiRISE, Diviner | GDAL PDS driver, `pds4-tools` | Label parsing is the hard part |

**Default 2026 stack for this hackathon:** COG + STAC + `earthaccess`/`pystac-client` + `xarray` + `rasterio`, served as tiles with `titiler` or read in the browser from a small pre-computed Zarr/GeoParquet file. Use FITS/HDF5 only where the mission forces it (SPHEREx, NISAR, GEDI, PSI).

**Cloud access reality**

- NASA Earthdata Cloud is in **AWS `us-west-2`**. Direct S3 access needs temporary credentials from the DAAC (`.../s3credentials`), valid ~1 hour.
- Outside `us-west-2`, `earthaccess` falls back to HTTPS. That is fine for a laptop demo but slow for large stacks.
- NISAR, GEDI, SMAP and many LP DAAC collections are cloud-hosted; MODIS HDF4 and many legacy products are not.
- NASA does not charge for the data, but moving it out of `us-west-2` can incur AWS egress and always costs time. Pre-download the 200 MB you actually need before the clock starts.
- The SPHEREx bucket `nasa-irsa-spherex` (us-east-1) and the OSDR bucket `nasa-osdr` (us-west-2) are public-read; no credentials needed.

### 3.4 The night-before download list

| Challenge family | Download this | Rough size | Why |
|---|---|---|---|
| FARMS | POWER point JSON for 5 fields × 20 years; SMAP L3 subset for 1 region; one Sentinel-2 COG | 50–300 MB | Instant time series + one hero map |
| FIRMS | FIRMS CSV for 3 regions, 2001–2025, MODIS_SP + VIIRS_SP | 100–500 MB | Harmonization needs both sensors |
| SAR | One NISAR GCOV/GSLC pair over your site + Sentinel-1 fallback | 1–5 GB | NISAR validated record starts 21 Oct 2026 |
| TREND | Giovanni CSV for 3 variables × 3 regions; one MERRA-2/GLDAS subset | 50–500 MB | Enough for a real Mann–Kendall demo |
| LUNAR | LOLA DEM + Diviner south-pole products; Horizons ephemeris for 3 sites × 30 days | 100 MB–1 GB | Terrain + ephemeris are the whole app |
| MARS | MOLA DEM + one HiRISE/CTX mosaic from Trek; Perseverance images | 200 MB–2 GB | Trek tiles can also be streamed |
| SPHEREX | Cutouts for Barnard’s Star, Epsilon Indi B, WISE 0855, RW Aur, R Dra | 100 MB–2 GB | The challenge names the test targets |
| JUKE | SVS frames for 6 visualizations (PNG sequences, not MP4) | 1–5 GB | Frame-level sonification needs stills |
| FLAME | PSI packages for FLEX, Saffire-I/II/III, BASS/BASS-II | 1–10 GB | PSI is login-gated and slow |
| RELIC | NSSDCA records + 20–30 mission images | <100 MB | Narrative, not analysis |
| JUNIOR | DONKI JSON snapshot + RadLab API extract + OSDR study list | <100 MB | Avoid live-API failure on stage |
| ANALOG | One Earth DEM + landcover + temperature stack; LRO/Mars PDS products | 500 MB–3 GB | Cross-domain comparison |
| HEALTH | No dataset exists in the list — build a synthetic physiological model and cite HRP | 0 | Flag this as a data gap |
| GAME | No dataset exists — use GMAT outputs and mission-design documents | 0 | Flag this as a data gap |

---

## 4. NASA open-source and licensing rules

### 4.1 NASA Open Source Agreement (NOSA) vs Apache-2.0

| Dimension | NOSA 1.3 | Apache-2.0 |
|---|---|---|
| Status | OSI-approved (2003); NASA’s public-release licence for much NASA-funded software; >60 projects since 2003 | OSI-approved; industry standard |
| Type | Contract-based, reciprocal: distribution/redistribution must be under NOSA | Permissive, copyright + patent grant |
| Patent grant | Yes, but narrower/less explicit | Explicit, robust |
| Registration clause | Section 3.F **requests** registration with the originating agency and notification of modifications | None |
| “Original creation” clause | Section 3.G: contributor represents the modification is their original creation and does not violate other agreements | None; explicitly allows combining works |
| Source availability | If distributed in binary form, source must be made freely available | No source-availability requirement |
| NOTICE file | Not required | Required if one exists |
| Version in use | **1.3** is the version published by NASA (PDF, 2025 upload) and approved by OSI | — |
| Where you see it | Older NASA releases, some NASA GitHub repos | `nasa/openmct`, `nasa/earthdata-search`, `NASA-IMPACT/veda-ui`, `nasa-gibs/gibs-web-examples`, `nasa/GMAT` |
| Text | https://opensource.org/license/nasa-1-3; NASA PDF https://www.nasa.gov/wp-content/uploads/2025/08/nasa-open-source-agreement-1-3.pdf | https://www.apache.org/licenses/LICENSE-2.0 |

**Verified sources:** NASA’s own page (https://www.nasa.gov/nasa-open-source-development/) says NOSA is OSI-approved and has been used for more than 60 projects since 2003; the NOSA 1.3 text is at the OSI link and the NASA PDF above; the reciprocal/source/registration/original-creation clauses were read in the NOSA 1.3 text.

**Practical rules for the hackathon**

1. **Your own code:** MIT or Apache-2.0. Do not use NOSA unless you are a NASA release authority; you are not.
2. **NASA code you reuse:** keep its existing licence. GMAT is Apache-2.0; `earthaccess` is MIT; the CSA SAR tutorial is MIT. Do not relicense.
3. **NASA code with no licence** (e.g. `nasa/mission-viz` — no `LICENSE` file found): treat as all rights reserved. Link to it; do not copy it.
4. **Public domain is not “no obligation”:** cite the source, and do not imply endorsement.
5. **Do not call your project “NASA open source”** or use NOSA language in the submission. Say “uses NASA open data” and list the licences.

### 4.2 NASA media usage guidelines

Verified at https://www.nasa.gov/nasa-brand-center/images-and-media/.

- NASA content (images, audio, video, 3D model files) is **generally not subject to copyright in the United States**.
- Educational/informational use is permitted, including photo collections, textbooks, public exhibits, computer simulations and personal web pages.
- **No endorsement**: NASA content may not be used to suggest or imply endorsement by NASA or any NASA employee of a commercial product, service or activity, or in any misleading way.
- **NASA’s name, insignia, logotype and identifiers are not in the public domain.** Their use is protected by law. NASA imagery is generally usable under the media guidelines, but do not use the logo or mission identifiers as your app icon, splash screen or brand.
- Third-party copyrighted material on NASA sites is marked with the copyright holder; NASA’s permission does not transfer to you.
- Commercial use has extra limits: no endorsement, no filming on NASA property, and identifiable persons may have privacy/publicity rights. NASA does not license NASA materials or sign licensing agreements.
- Credit NASA as the source.

**Implications for a dither aesthetic**

- You may download, crop, palette-reduce, Bayer-dither, halftone or error-diffuse NASA imagery.
- You may not present the result as an official NASA product, or use the meatball/worm/NASA logotype as your identity.
- Put “NASA does not endorse this project” in the footer and the README.
- For SI-generated images/videos, the Space Apps 2026 rule adds a **visible “AI/SI-generated” watermark** (see §4.6), and generated content may not contain NASA branding or mission identifiers.

### 4.3 Earthdata data citation policy

Verified at https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance.

Key rules:

1. **Default licence is CC0** for data from NASA-led missions, unless the data are marked with a restriction or a different licence. This covers observations, engineering/calibration/auxiliary data, metadata and products.
2. **Non-NASA data** distributed through ESDIS remains subject to the sponsoring organisation’s licence. Validate before you use it in a demo.
3. NASA **asks — strongly — that you cite** the dataset even though CC0 does not legally require it. Citation is a community norm, and judges notice.
4. Cite the **dataset**, not the portal. Use the DOI on the product landing page; include the version and access date.
5. Recommended format is APA-like (ESIP guidance): author(s), year, product name, version, publisher/DAAC, DOI.
6. **GIBS** has its own acknowledgement wording: *“We acknowledge the use of imagery provided by services from NASA’s Global Imagery Browse Services (GIBS), part of NASA’s Earth Science Data and Information System (ESDIS).”* (verified at https://nasa-gibs.github.io/gibs-api-docs/).
7. **Worldview** imagery inherits the GIBS attribution; add the layer/instrument and date.
8. **OSDR** citation wording (verified at https://science.nasa.gov/reference/osdr-faq/): *“Data are courtesy of the NASA Open Science Data Repository (https://osdr.nasa.gov/bio/repo).”* For RadLab: *“Data and visualizations are courtesy of the RadLab Portal (https://visualization.osdr.nasa.gov/radlab/gui/overview/), Version #.”*

A citation format example:

> Author(s). Year. Product name, version [subset used]. Publisher/DAAC. DOI. Accessed YYYY-MM-DD.

The exact author/year/title/DOI for your product is pre-filled on the DOI landing page — copy it from there rather than typing it.

### 4.4 Partner-agency data terms

| Provider | Data in these challenges | Licence / terms | Commercial use | Required credit | Gotcha |
|---|---|---|---|---|---|
| **CSA (Canada)** | RCM, RADARSAT-1, NEOSSat | **Open Government Licence – Canada** on the dataset records | OGL allows commercial use with attribution; check any per-product RCM licence | “Contains information licensed under the Open Government Licence – Canada.” | EODMS download gate; licence acceptance per product; some EODMS app paths block curl |
| **ESA / Copernicus** | Sentinel-2, Copernicus Data Space | **Copernicus Sentinel Data Legal Notice**: free, full and open for Sentinel data; portal content is non-commercial | Sentinel data: yes; portal content: no | “Contains modified Copernicus Sentinel data [year]” | Registration required to download; the legal notice is at https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice |
| **ESA Science Archives** | Gaia DR3 | **CC BY-NC 3.0 IGO** | **No** — commercial use needs an ESA licence | “ESA/Gaia/DPAC” | The non-commercial restriction is easy to miss; it applies to the archive data |
| **ESA Open Science Catalog** | Metadata only | Per-product licence in the STAC record | Varies | Follow the product | The catalog is metadata; the data lives elsewhere |
| **JAXA** | G-Portal (GPM/GSMaP, GCOM, ALOS, EarthCARE) | Free, including commercial use, **but** source indication + prior notice for commercial use; peaceful purposes only | Yes, with prior notice | “The original data ... were provided by the Japan Aerospace Exploration Agency.” | Free account; no scraping; source indication mandatory; some datasets may need an additional agreement |
| **CONAE (Argentina)** | SAOCOM | Custom: registration + **Convenio** + signed product licence | Case-by-case | Per agreement | Not open by default. The “ONE CLICK” claim in the challenge is misleading — downloads require the agreement |
| **USDA / USGS / NOAA** | CDL, SSURGO, NAIP, NLCD, NWIS, QuickStats, CDO | **U.S. public domain** | Yes | Courtesy credit | API keys/tokens for QuickStats and CDO; some sites block automated access |
| **PRISM (Oregon State)** | PRISM climate | Custom terms: free reproduction/distribution with attribution; commercial redistribution may need a separate agreement | Check before shipping | “PRISM Group, Oregon State University, https://prism.oregonstate.edu, accessed [date]” | Not a CC licence; terms page is at https://prism.oregonstate.edu/terms |
| **OpenET** | Field-scale ET | Website terms prohibit commercial use, resale and derivative works; attribution required | **No** under the website terms | “Source: OpenET” | Check whether another distribution has different terms; do not assume CC BY |
| **FAO / IIASA GAEZ** | Agro-ecological zones | FAO terms; non-commercial share-alike reported | **No** (reported) | FAO/IIASA citation | Exact licence not visible on the JS portal — **verify before use (UNVERIFIED exact version)** |
| **CADC (Canada)** | Astronomy archive | Varies by collection | Varies | Per collection | Some collections need an account; some are anonymous |
| **IRSA / Caltech** | SPHEREx, WISE | NASA-funded archive; public access; acknowledgment requested | Check per product | “NASA/IPAC Infrared Science Archive” | No explicit CC licence found on the SPHEREx page; treat as NASA public data with acknowledgment |
| **KNMI** | Climate Explorer | Custom, attribution | Check | “KNMI Climate Explorer” | Web tool, not a bulk API |
| **Medium / Statsig** | Two trend-test articles | Copyright the authors | No | Do not republish | Replace with primary statistical references |

### 4.5 Ready-to-paste attribution templates

**A. Project README — full block**

```markdown
## Data credits and licences

This project uses open NASA data and partner-agency data. **NASA does not endorse this project.**

### NASA data
- <Product name>, <version>, <DOI or product URL>, accessed <YYYY-MM-DD>, courtesy of NASA <DAAC name>.
- Imagery provided by NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS).
- <Moon/Mars> terrain and base maps: NASA/JPL <Trek product name>, via NASA Trek (U.S. public domain).
- Additional NASA data: <list>.

NASA-led mission data are released under Creative Commons Zero (CC0) unless marked otherwise. NASA content is generally not copyrighted in the United States and is used under NASA's Media Usage Guidelines (https://www.nasa.gov/nasa-brand-center/images-and-media/). NASA does not license or endorse this project.

### Partner data
- Contains modified Copernicus Sentinel data <year>, processed by ESA.
- <JAXA product> is provided by the Japan Aerospace Exploration Agency (JAXA).
- Contains information licensed under the Open Government Licence – Canada (CSA <dataset>).
- <Other partner>: <required credit line>.

### Code
- <Library> — <licence> — <URL>.
- Our code: <MIT / Apache-2.0>.

### AI / SI disclosure
- <Tool/model> was used for <task>. AI/SI-generated images/video are visibly watermarked "AI/SI-generated"; audio is disclosed in the description and metadata; code/data assistance is disclosed here and in the submission.
```

**B. Space Apps submission page — short block**

```text
NASA data: <product(s)> via <DAAC/service>. Partner data: <agency/product>.
Full credits, licences and AI/SI disclosure: <public GitHub README URL>.
NASA does not endorse this project. AI/SI use: <one sentence>.
```

**C. In-app footer — one line**

```text
Data: NASA <product> / <DAAC> · Partner: <agency> · NASA does not endorse this project.
```

**D. Dither image credit — one line**

```text
Imagery: NASA <mission/instrument>, <date>. Ordered/Bayer dithering by <team>. NASA does not endorse this project.
```

**E. Dataset citation — one line**

```text
<Author(s)>. <Year>. <Product name>, <version> [subset used]. <DAAC/Publisher>. <DOI>. Accessed <YYYY-MM-DD>.
```

### 4.6 Space Apps 2026 rules on “SI” and attribution

Verified from the official participant FAQ (https://www.spaceappschallenge.org/resources/participant-faqs/) and the NASA Space Apps GitHub discussion https://github.com/nasa/spaceapps/discussions/1849 (answer dated 2026-11-06).

- **Terminology**: the 2026 programme uses **“Super Intelligence” / “SI”** in place of “Artificial Intelligence” / “AI”, per the 29 September 2026 U.S. Executive Order as quoted by the FAQ. Use “SI” in the submission text to match the programme’s language.
- **Eligibility**: to be eligible for a Global Award you must use **at least one NASA data source included in that challenge’s Resources**. Other NASA and partner data are encouraged but optional.
- **SI is permitted** and must be described: what tool, for what task.
- **SI-generated images and videos must carry a visible watermark** saying they are AI/SI-generated.
- **SI-generated audio** must be acknowledged in descriptive text and metadata.
- **SI-generated code and data** must be acknowledged in descriptive text and metadata.
- **SI-generated content may not use, contain or modify NASA branding or design elements** — logos, flags, mission identifiers.
- **Teams**: 1–6 members; Universal Event teams need at least 2 for global judging; one team, one challenge.
- **Partners**: 17 Space Agency Partners in 2026, including CSA, ESA, ISRO, JAXA, ASI, KASA, CONAE, AEB (Brazil), UKSA and MBRSC.
- **Submission**: through the team’s project page during the 14–15 November event; the project must be created during the hackathon (confirm the exact wording in the Participant Terms).

This is directly relevant to the team’s AI plan: a Gemini/Jev-driven demo is allowed, but every generated frame needs a watermark and the README needs a disclosure line. A dither pipeline that processes **real NASA pixels** is safer and more distinctive than a fully generated image.

---

## 5. Gaps and broken links

### 5.1 Hard failures

| Severity | URL | HTTP | What is wrong | Suggested replacement |
|---|---|---|---|---|
| **P0** | `https://visualization.osdr.nasa.gov/radlab/gui/data-api/` | **500** | RadLab GUI is down (Apache 500). The API still works **with query parameters**: `https://visualization.osdr.nasa.gov/radlab/api/?spacecraft=ISS&instrument=REM&limit=1` returned 200 CSV. | Use the API endpoint with explicit query; cite per the OSDR FAQ: “Data and visualizations are courtesy of the RadLab Portal (https://visualization.osdr.nasa.gov/radlab/gui/overview/), Version #.” Fallback: the OSDR AWS bucket `s3://nasa-osdr` (no-sign-request, verified 200). |
| **P1** | `https://www.nrcs.usda.gov/resources/data-and-reports/soils` | **000** | NRCS’s Akamai edge connects but never responds in this environment (GET times out; HEAD also stalls). It works in a normal browser. | Keep the link for humans; for programmatic soil data use Web Soil Survey (`https://websoilsurvey.nrcs.usda.gov/app/`, 200) or the USDA Soil Data Access API (`https://sdmdataaccess.sc.egov.usda.gov/`, 200). |
| **P1** | `https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b` | **403** | Medium bot-block. Works in a browser. | Replace with a primary/authoritative source: Mann–Kendall from USGS or NOAA, or the SciPy `kendalltau` docs. A blog is not a citable methods source for judging. |
| **P0** | `https://nassgeodata.gmu.edu/CropScape/` | **302→200** | Now redirects to `cat.csiss.gmu.edu/CropSmart/signin`; the old “no auth” CropScape is gone. | Use the NASS CDL release page (`https://www.nass.usda.gov/Research_and_Science/Cropland/Release/index.php`, 200) or create a CropSmart account. |
| **P2** | `https://eodms-sgdot.nrcan-rncan.gc.ca` (downstream of RCM/RADARSAT-1) | **403** | Some app paths return 403 to curl (root 200, `/welcome` 403); works in a browser. | For RADARSAT-1 use the AWS Open Data registry (`https://registry.opendata.aws/radarsat-1/`); for RCM use the CSA dataset page and EODMS in a browser. |

### 5.2 Misleading or under-specified links

| Severity | Resource | Problem | Fix |
|---|---|---|---|
| **P0** | FIRMS challenge has **one** link | No API docs, no MAP_KEY link, no source IDs, no date range. A team cannot build the harmonization from this page alone. | Add `https://firms.modaps.eosdis.nasa.gov/api/area/` and `https://firms.modaps.eosdis.nasa.gov/api/map_key/`; document `MODIS_SP` vs `VIIRS_*_SP`; note the 1–5 day query limit. |
| **P0** | NLDAS/GLDAS → `https://www.earthdata.nasa.gov/` | Generic home page, not a dataset. | Deep-link GES DISC: `https://disc.gsfc.nasa.gov/datasets?keywords=NLDAS` and `https://disc.gsfc.nasa.gov/datasets?keywords=GLDAS`. |
| **P0** | Landsat → `https://earthexplorer.usgs.gov/` | Login-gated portal; no product guidance. | Add USGS Landsat Collection 2 and LandsatLook; for code, use the cloud COGs via CMR/STAC. |
| **P0** | MODIS → `https://lpdaac.usgs.gov/products/` | A product *list*, not a product; it now redirects to the Earthdata LP DAAC center page. | Name the products you mean: `MOD13Q1` (NDVI), `MCD43A4` (BRDF), `MOD11A1` (LST). Direct links are stable: `https://lpdaac.usgs.gov/products/mod13q1v061/` (redirects to the Earthdata catalog). |
| **P0** | VIIRS → `https://search.earthdata.nasa.gov/search?q=VIIRS` | A search query, not a product; results change. | Link `VNP14IMG` / `VJ114IMG` on LAADS: `https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VNP14IMG/`. |
| **P0** | GPM → `https://gpm.nasa.gov/data` | Mission portal, not the IMERG product. | Add GES DISC IMERG and the STORM/earthaccess path; `https://gpm.nasa.gov/data/directory` is a better landing page. |
| **P0** | SAR challenge has no **`asf_search`** and no NISAR coverage warning | Teams will try to build a 2020–2026 NISAR time series that does not exist. | Add `https://github.com/asfadmin/asf_search` and the availability page: validated L0–L2 only from 21 Oct 2026; provisional from 17 Jun 2026; BETA from Feb 2026. |
| **P1** | MARS challenge links **Worldview** | Worldview is an Earth-only imagery browser. It cannot show Mars. | Replace with Mars Trek + PDS; keep Worldview only as an interaction-design reference. |
| **P1** | SAOCOM “ONE CLICK Login Profile” | The actual CONAE page says downloads require registration, a **Convenio** with CONAE and a signed SAOCOM product licence. | Change the text; provide a fallback (Sentinel-1 via ASF, or RADARSAT-1) for teams that cannot get SAOCOM access in 48 hours. |
| **P1** | OpenET | Website terms prohibit commercial use, resale and derivative works. | Use a separately licensed copy if needed; otherwise treat as non-commercial and say so. |
| **P1** | PRISM | Free with attribution, but commercial redistribution may need a separate agreement; not a CC licence. | Add the PRISM terms link `https://prism.oregonstate.edu/terms/`; do not describe it as “open”. |
| **P1** | Gaia | CC BY-NC 3.0 IGO — non-commercial. | Flag it; for a commercial product you need an ESA licence. |
| **P1** | GAEZ | Non-commercial share-alike reported; exact licence not visible on the JS portal. | Flag it; verify the licence before shipping. |
| **P1** | PSI | Login-gated; NASA Guest Account/SSO required. | Pre-download the FLEX/Saffire/BASS packages; do not plan a live PSI demo. |
| **P1** | QuickStats / CDO | Both need keys/tokens that the resource list never mentions. | Add the key/token links; cache responses. |
| **P1** | Mission Viz | `nasa/mission-viz` has **no LICENSE file** in the repository root. | Link only; do not copy code. If you need a licence, ask NASA/JPL. |
| **P1** | JAXA G-Portal | Commercial use is allowed but requires **prior notice** and source indication. | Add the terms link `https://www.gportal.jaxa.jp/gpr/index/eula?lang=en`; do not call it “unrestricted”. |
| **P2** | 8 ANALOG URLs carry `?utm_source=%27chatgpt.com%27` | Cosmetic, but it signals a scraped citation and looks unprofessional in a submission. | Strip the parameter. |
| **P2** | `http://byw.tools/wiseview` | HTTPS fails; HTTP works. | Use `http://` knowingly, or link the WISE/NEOWISE data at IRSA. |
| **P2** | Medium / Statsig articles | Non-authoritative, one is 403. | Replace with peer-reviewed or agency methods pages. |
| **P2** | CSA `NEOSSat` dataset | FITS only, no preview; the page is a metadata record. | Add the CADC/NEOSSat tutorial; expect to write your own FITS reader. |
| **P2** | `https://opensciencedata.esa.int/` | A JS shell; it is a metadata catalog, not a data archive. | Use the STAC API or follow the product links. |
| **P2** | `https://nassgeodata.gmu.edu/CropScape/` | Redirects to a sign-in shell. | Use the NASS CDL release page; see §5.1. |
| **P2** | `https://search.earthdata.nasa.gov/?utm_source=...` | UTM variant of the main Earthdata Search URL. | Strip the parameter. |

### 5.3 Missing but high-value (add these to the team’s toolkit)

1. **`earthaccess`** — the single biggest accelerator for every Earth challenge. `MIT`.
2. **CMR + CMR STAC** — one search API instead of 12 DAAC-specific interfaces. `CC0`.
3. **GIBS directly** — no key, no login, dated tiles, perfect for dithering. `CC0`.
4. **`images.nasa.gov` API** — the only image library with a clean JSON API and usage terms. `PD`.
5. **`asf_search`** — the NISAR/SAR search library the SAR challenge forgot. `BSD-3-Clause`.
6. **`astropy`** — required for SPHEREx/Gaia/NEOSSat FITS. `BSD-3-Clause`.
7. **NASA SVS** — already in JUKE, but underused by RELIC/MARS/GAME for hero assets. `PD`.
8. **JPL Horizons API** — already in LUNAR, but it would also make GAME’s orbital mechanics real. `PD`.
9. **DONKI** — already in JUNIOR, but it is also the radiation-risk source for HEALTH and the space-weather source for LUNAR. `PD`.
10. **OSDR AWS bucket** (`s3://nasa-osdr`, no-sign-request) — bypasses the RadLab GUI entirely. Public studies are open; some human data remains controlled.
11. **SPHEREx S3 bucket** (`s3://nasa-irsa-spherex`, no-sign-request) — the fastest path to DR1 FITS.
12. **Trek REST** — undocumented but public ArcGIS ImageServer and TrekServices endpoints; use them instead of scraping the JS app.
13. **ISRO Bhoonidhi** (`https://bhoonidhi.nrsc.gov.in/bhoonidhi/home.html`) — the S-band NISAR distribution path, missing from every resource list.

### 5.4 Structural gaps in the official lists

- **No ISRO link anywhere**, despite NISAR being a NASA–ISRO mission. The data are served by ASF, but the mission credit and the Indian distribution path are absent.
- **No Brazil (AEB), UKSA, ASI, KASA or MBRSC links**, even though they are 2026 Space Agency Partners. SWOT is NASA/CNES but only CSA’s SWOT page is linked; CNES is not a 2026 Space Apps partner.
- **No NASA data for FLAME beyond PSI** — no combustion-image dataset, no tabular API. The challenge is essentially a document-mining task.
- **No dataset at all for HEALTH and GAME** — both are “build a tool” challenges with reference reading only. That is a legitimate design, but teams must know they are not data challenges.
- **No licensing information on any challenge page.** Every team will make its own guess. This document is the substitute.
- **No API documentation for FIRMS, PSI, RadLab, Trek or OSDR** — the services most likely to be used at 2 a.m.

### 5.5 Corrections to earlier assumptions

- The unique-URL count is **133**, not 134; `backyardworlds.org` is in the SPHEREx body, not the Resources tab.
- **130**, not 131, return HTTP 200 after retrying the CSA Moon page.
- **CropScape is no longer no-auth**; it redirects to CropSmart sign-in.
- **NRCS is unreachable from this environment**, not merely “TLS-blocked” — GET and HEAD both stall at the Akamai edge.
- **NISAR BETA** was released 27 Feb 2026 with >100,000 products (>500 TB), not “Jan/Feb 2026” generically.
- **EOSDIS FY2026** archive is 225.7 PB (152.1 PB cloud), not the FY2025 178.7 PB figure in the earlier draft.
- **SPHEREx DR1** is live in November 2026, and the S3 bucket name is `nasa-irsa-spherex` (verified), not a generic “AWS S3 bucket”.
- **JAXA G-Portal** allows commercial use but requires prior notice and source indication; it is not “custom terms, check”.
- **OpenET’s website terms** prohibit commercial use and derivative works; do not describe the website data as CC BY.

---

## Key findings

1. **The lists are link-rich but data-poor in exactly the places that matter.** 133 unique URLs, but FIRMS gets 1, LUNAR 4, HEALTH 5 and MARS 5. FARMS alone has 26.
2. **Only 4 URLs are shared across challenges.** The reuse surface is almost zero; the real reuse is in the *services* (CMR, GIBS, POWER, FIRMS, Trek, SVS), not the links.
3. **`earthaccess` + CMR/STAC + GIBS are missing from all 14 lists** and would save every Earth team at least half a day.
4. **RadLab’s GUI is genuinely broken (500)**, but the data API is alive with query parameters and the OSDR S3 bucket is open. Use both, and cite the OSDR FAQ wording.
5. **NISAR is usable now, but the validated record is short.** Validated L0–L2 starts 21 Oct 2026; provisional starts 17 Jun 2026; BETA starts Feb 2026. Any multi-year NISAR time series is impossible.
6. **Three licensing traps can sink a submission:** Gaia is CC BY-NC (no commercial), OpenET’s website terms prohibit commercial use and derivatives, and GAEZ’s exact terms need verification before use.
7. **SAOCOM is not “one click”.** It needs registration, a Convenio and a signed licence. RADARSAT-1 (OGL-Canada) and Sentinel-1 (Copernicus) are the realistic 48-hour SAR fallbacks.
8. **NASA Earthdata data are CC0 by default, but NASA imagery is not the same thing as NASA branding.** You can dither the pixels; you cannot use the insignia or imply endorsement. Space Apps 2026 adds a visible “AI/SI-generated” watermark rule on top.
9. **The 2026 programme calls AI “SI”** and requires disclosure of where and how it was used — including watermarking generated images/video and disclosing generated audio, code and data.
10. **The best 48-hour strategy is one shared data spine** (CMR/STAC → `earthaccess`/`rasterio`/`xarray` → GIBS/Trek tiles) with challenge-specific layers, not 14 separate pipelines.
11. **Trek is an under-documented goldmine.** Moon has 279 ArcGIS services; Mars has 7 DEM ImageServers plus a global MOLA service; `exportImage`, elevation, slope, sun-angle and crater/rock endpoints are public and need no key.
12. **CropScape’s silent sign-in change is a 2026 regression** that the challenge text has not caught up with.

## Open questions

1. Which challenge(s) is the team actually targeting? The answer changes the P0 download list and the account priority.
2. Do we need commercial-use rights? If the answer is “maybe later”, exclude Gaia, GAEZ and OpenET website data from the core pipeline.
3. Is a NISAR baseline before 21 Oct 2026 acceptable for the SAR story, given the BETA/PROVISIONAL maturity labels? If not, pair NISAR with Sentinel-1 or RADARSAT-1.
4. Can we get a CONAE Convenio in time? If not, drop SAOCOM from the plan entirely.
5. Do we want to use PSI (login-gated, slow) for FLAME, or build the dashboard on the public investigation metadata plus a small curated data package?
6. Which SI provider will we disclose? Gemini, Jev or another model — the submission needs a concrete sentence, and generated media needs a watermark.
7. Is there a team member who can own FITS/HDF5 reading (SPHEREx, NISAR, GEDI, PSI)? Those formats are where 48-hour projects lose the most time.
8. Do we want to publish the project under MIT or Apache-2.0? Apache-2.0 is the safer default if we reuse GMAT-adjacent code; MIT is simpler if we do not.
9. Should we include a “data availability” badge in the README (live / cached / synthetic) so judges can see what is real?
10. Does the team want to target a global category (Best Use of Data, Best Storytelling, Art & Technology)? The dither aesthetic and the Jukebox/RELIC challenges fit “Art & Technology” better than a generic dashboard does.
