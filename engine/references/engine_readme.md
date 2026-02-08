# Engine Folder

The `engine/` folder contains the scraping + image processing pipeline that produces database-ready JSON and cleaned images.

## What It Does

The engine pipeline starts with a list of profile URLs and ends with:
- `app/data/page_data.json`
- `app/data/image_data.json`
- cleaned images in `app/data/clean_image/`

## Key Inputs
- `engine/page_source.json` — source URLs to scrape

## Main Scripts (Run In Order)

1) Scrape page content + image URLs
```bash
python3 engine/scrape_full_image.py
```
Outputs:
- `engine/page_output.json`
- `engine/info_output.json`
- `engine/image_output.json` (image URLs, `IMW_` ids)

2) Download images + remove watermark
```bash
python3 engine/remove_watermark.py
```
Uses:
- `engine/image_output.json`

Outputs:
- cleaned images in `app/data/clean_image/` (named `IM_...`)
- debug masks in `engine/watermark/debug/`

3) Build database-ready JSON
```bash
python3 engine/build_data.py
```
Outputs:
- `app/data/page_data.json` (adds `uuid` per profile)
- `app/data/image_data.json` (references cleaned image files)

## Internal Folders

- `engine/site_scrapper/` — site-wide link scrapers (optional)
- `engine/watermark/` — watermark tools and temp downloads
- `engine/watermark/watermark_images/target/` — temporary downloaded images before cleaning

## Notes
- The target folder is only a cache; you can clear it safely.
- The cleaned images are stored in `app/data/clean_image/` and referenced by `app/data/image_data.json`.

## Packages And Libraries Used

This is a concise inventory of external libraries used in the `engine/` folder, with where/how they are used.

Scraping stack
- `selenium`  
  Used in `engine/scrape_full_image.py`, `engine/site_scrapper/scrape_deep.py`, `engine/site_scrapper/scrape_surface.py`, and `engine/page_scrapper/scrape_page_thumbnail.py` for browser automation and DOM scraping (`By`, `find_elements`, `get`, etc.).
- `undetected_chromedriver`  
  Used in the same scraper files to reduce bot detection while driving Chrome.
- `selenium-stealth`  
  Used in the same scraper files to spoof browser fingerprints (language, vendor, platform, WebGL).

Watermark removal stack
- `opencv-python` (`cv2`)  
  Used in `engine/remove_watermark.py` for image IO, mask creation, and dilation.
- `numpy`  
  Used in `engine/remove_watermark.py` for array/mask operations.
- `easyocr`  
  Used in `engine/remove_watermark.py` to locate watermark text via OCR.
- `simple-lama-inpainting` (`simple_lama_inpainting`)  
  Used in `engine/remove_watermark.py` to inpaint masked watermark regions.
- `Pillow` (`PIL`)  
  Used in `engine/remove_watermark.py` to bridge OpenCV images into the LaMa inpainting model.

Data assembly
- Standard library only: `json`, `os`, `re`, `uuid`  
  Used in `engine/build_data.py` to create `app/data/page_data.json` and `app/data/image_data.json`.

Network download
- Standard library `urllib.request` and `urllib.parse`  
  Used in `engine/remove_watermark.py` to download images from `image_output.json`.

## Where Each Script Uses Them (Quick Map)

- `engine/scrape_full_image.py`  
  `undetected_chromedriver`, `selenium`, `selenium-stealth`, `urllib.parse`
- `engine/site_scrapper/scrape_deep.py`  
  `undetected_chromedriver`, `selenium`, `selenium-stealth`, `urllib.parse`
- `engine/site_scrapper/scrape_surface.py`  
  `undetected_chromedriver`, `selenium`, `selenium-stealth`, `urllib.parse`, `collections.deque`
- `engine/page_scrapper/scrape_page_thumbnail.py`  
  `undetected_chromedriver`, `selenium`, `selenium-stealth`, `urllib.parse`
- `engine/remove_watermark.py`  
  `opencv-python`, `numpy`, `easyocr`, `simple-lama-inpainting`, `Pillow`, `urllib`
- `engine/build_data.py`  
  Standard library only
