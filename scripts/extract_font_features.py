#!/usr/bin/env python3
"""
extract_font_features.py — OpenType Feature & Glyphs Extractor for Brandview
Scans extracted Envato and author fonts, parses GSUB tables and PUA glyphs,
and outputs a comprehensive JSON database to server/fonts_features.json.

This ensures that stylistic sets (ss01-ss09), swashes, ligatures, and decorative
capitals (e.g., Kalieb Luxury, Biancha, Sagora) are properly exposed to the UI.
"""

import os
import re
import json
import glob
from fontTools.ttLib import TTFont

SEARCH_PATHS = [
    '/mnt/localstorage/baiosfera/FUENTES/ENVATO/_extracted',
    '/mnt/localstorage/FUENTES/ENVATO/_extracted',
    '/var/www/baiosfera/FUENTES/ENVATO/_extracted',
    '/mnt/baiostorage/baiosfera/FUENTES/ENVATO/_extracted'
]

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'server', 'fonts_features.json')

def find_font_dirs():
    return [p for p in SEARCH_PATHS if os.path.isdir(p)]

def inspect_font(font_path):
    try:
        font = TTFont(font_path)
    except Exception as e:
        return None

    features = set()
    stylistic_sets = set()
    substitutions = {}

    if 'GSUB' in font:
        gsub = font['GSUB'].table
        if hasattr(gsub, 'FeatureList') and gsub.FeatureList:
            for record in gsub.FeatureList.FeatureRecord:
                tag = record.FeatureTag
                features.add(tag)
                if tag.startswith('ss') and len(tag) == 4 and tag[2:].isdigit():
                    stylistic_sets.add(tag)

        if hasattr(gsub, 'LookupList') and gsub.LookupList:
            feature_lookup_indices = {}
            if hasattr(gsub, 'FeatureList') and gsub.FeatureList:
                for record in gsub.FeatureList.FeatureRecord:
                    tag = record.FeatureTag
                    feature_lookup_indices[tag] = record.Feature.LookupListIndex

            for ss_tag in sorted(stylistic_sets):
                substitutions[ss_tag] = {}
                indices = feature_lookup_indices.get(ss_tag, [])
                for idx in indices:
                    if idx < len(gsub.LookupList.Lookup):
                        lookup = gsub.LookupList.Lookup[idx]
                        for subtable in lookup.SubTable:
                            if hasattr(subtable, 'mapping'):
                                for orig, sub in subtable.mapping.items():
                                    substitutions[ss_tag][orig] = sub

    pua_glyphs = []
    if 'cmap' in font:
        cmap = font['cmap'].getBestCmap()
        if cmap:
            for codepoint, glyph_name in sorted(cmap.items()):
                if 0xE000 <= codepoint <= 0xF8FF:
                    pua_glyphs.append({
                        "hex": f"U+{codepoint:04X}",
                        "char": chr(codepoint),
                        "name": glyph_name
                    })

    font_name = os.path.splitext(os.path.basename(font_path))[0]
    return {
        "name": font_name,
        "file": os.path.basename(font_path),
        "features": sorted(list(features)),
        "stylistic_sets": sorted(list(stylistic_sets)),
        "substitutions": substitutions,
        "pua_count": len(pua_glyphs),
        "pua_glyphs": pua_glyphs
    }

def main():
    font_dirs = find_font_dirs()
    if not font_dirs:
        print("❌ No font directories found in known paths.")
        return

    print(f"🔍 Searching fonts in: {font_dirs}")
    results = {}
    for d in font_dirs:
        for ext in ('*.ttf', '*.otf', '*.woff', '*.woff2'):
            pattern = os.path.join(d, '**', ext)
            for font_file in glob.glob(pattern, recursive=True):
                data = inspect_font(font_file)
                if data and (data['features'] or data['pua_glyphs']):
                    norm_key = re.sub(r'[\s\-_]', '', data['name'].lower())
                    results[norm_key] = data
            pattern_flat = os.path.join(d, ext)
            for font_file in glob.glob(pattern_flat):
                data = inspect_font(font_file)
                if data and (data['features'] or data['pua_glyphs']):
                    norm_key = re.sub(r'[\s\-_]', '', data['name'].lower())
                    results[norm_key] = data

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"✅ Successfully cataloged {len(results)} fonts to {OUTPUT_PATH}")

if __name__ == '__main__':
    main()
