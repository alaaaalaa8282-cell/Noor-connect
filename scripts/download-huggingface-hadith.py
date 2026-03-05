#!/usr/bin/env python3
"""Download HuggingFace hadith dataset"""
import os
import json
from huggingface_hub import hf_hub_download, list_repo_files

REPO_ID = "meeAtif/hadith_datasets"
OUTPUT_DIR = "temp/huggingface"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# List files in repo
print("Listing files in repo...")
files = list_repo_files(REPO_ID, repo_type="dataset")
print(f"Found {len(files)} files")

# Download all JSON and CSV files
for file in files:
    if file.endswith(('.json', '.csv')):
        print(f"Downloading {file}...")
        try:
            path = hf_hub_download(
                repo_id=REPO_ID,
                filename=file,
                repo_type="dataset",
                local_dir=OUTPUT_DIR,
                local_dir_use_symlinks=False
            )
            print(f"  Saved to {path}")
        except Exception as e:
            print(f"  Error: {e}")

print("\nDownload complete!")
