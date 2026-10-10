#!/usr/bin/env python3
"""
Apple Container Storage Migrator to External NVMe SSD
Preserves APFS sparse files via macOS SEEK_DATA / SEEK_HOLE
"""

import os
import sys
import time
import shutil
import subprocess

import glob

DEFAULT_SOURCE = os.path.expanduser("~/Library/Application Support/com.apple.container")
TARGET_DIR = "/Volumes/samsung2tb980pro/DeveloperData/apple-container"
CONTAINER_BIN = "/opt/homebrew/bin/container"

def copy_file_sparse(src, dst):
    """Copy file preserving sparse extents via low-level OS descriptors."""
    length = os.path.getsize(src)

    # Empty file
    if length == 0:
        fd = os.open(dst, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
        os.close(fd)
        shutil.copystat(src, dst)
        return

    fd_src = os.open(src, os.O_RDONLY)
    fd_dst = os.open(dst, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)

    try:
        os.ftruncate(fd_dst, length)
        pos = 0
        while pos < length:
            try:
                data_start = os.lseek(fd_src, pos, os.SEEK_DATA)
            except OSError:
                break
            try:
                hole_start = os.lseek(fd_src, data_start, os.SEEK_HOLE)
            except OSError:
                hole_start = length

            os.lseek(fd_src, data_start, os.SEEK_SET)
            os.lseek(fd_dst, data_start, os.SEEK_SET)

            to_copy = hole_start - data_start
            while to_copy > 0:
                chunk = os.read(fd_src, min(to_copy, 16 * 1024 * 1024))
                if not chunk:
                    break
                os.write(fd_dst, chunk)
                to_copy -= len(chunk)
            pos = hole_start
    finally:
        os.close(fd_src)
        os.close(fd_dst)

    shutil.copystat(src, dst)

def sync_tree(src_dir, dst_dir):
    """Recursively sync src_dir to dst_dir preserving sparse files and symlinks."""
    os.makedirs(dst_dir, exist_ok=True)
    for root, dirs, files in os.walk(src_dir):
        rel_path = os.path.relpath(root, src_dir)
        target_root = os.path.join(dst_dir, rel_path) if rel_path != "." else dst_dir
        os.makedirs(target_root, exist_ok=True)

        for d in dirs:
            target_sub = os.path.join(target_root, d)
            os.makedirs(target_sub, exist_ok=True)

        for f in files:
            src_file = os.path.join(root, f)
            dst_file = os.path.join(target_root, f)

            if os.path.islink(src_file):
                link_target = os.readlink(src_file)
                if os.path.lexists(dst_file):
                    os.unlink(dst_file)
                os.symlink(link_target, dst_file)
            else:
                rel_file_path = os.path.relpath(src_file, src_dir)
                size_mb = os.path.getsize(src_file) / (1024 * 1024)
                if size_mb > 100:
                    print(f"  -> Copying large/sparse file: {rel_file_path} (logical {size_mb:.1f} MB)...", flush=True)
                copy_file_sparse(src_file, dst_file)

def main():
    print("==========================================================")
    print(" Apple Container Storage Fast Migration (APFS Sparse)    ")
    print("==========================================================")

    if not os.path.exists("/Volumes/samsung2tb980pro"):
        print("❌ Error: External disk /Volumes/samsung2tb980pro is not mounted!")
        sys.exit(1)

    print("\n1. Stopping container system service safely...")
    subprocess.run([CONTAINER_BIN, "system", "stop"], check=False)
    time.sleep(2)

    # Locate source data
    source_dir = DEFAULT_SOURCE
    if os.path.islink(DEFAULT_SOURCE):
        bak_matches = sorted(glob.glob(os.path.expanduser("~/Library/Application Support/com.apple.container.bak-*")))
        if bak_matches:
            source_dir = bak_matches[-1]
            print(f"ℹ️ Found original data source at: {source_dir}")

    print(f"\n2. Creating target directory: {TARGET_DIR}...")
    os.makedirs(TARGET_DIR, exist_ok=True)

    print(f"\n3. Transferring container data with byte-accurate sparse cloning from {source_dir}...")
    t0 = time.time()
    sync_tree(source_dir, TARGET_DIR)
    t1 = time.time()
    print(f"✅ Sync finished in {t1 - t0:.2f} seconds!")

    print(f"\n4. Ensuring symlink {DEFAULT_SOURCE} -> {TARGET_DIR}...")
    if not os.path.islink(DEFAULT_SOURCE):
        backup_dir = f"{DEFAULT_SOURCE}.bak-{int(time.time())}"
        print(f"  Renaming original to: {backup_dir}")
        os.rename(DEFAULT_SOURCE, backup_dir)
        os.symlink(TARGET_DIR, DEFAULT_SOURCE)
        print(f"✅ Symlink created: {DEFAULT_SOURCE} -> {TARGET_DIR}")
    else:
        print(f"ℹ️ {DEFAULT_SOURCE} is already pointing to target.")

    print("\n5. Starting container system service on external SSD...")
    subprocess.run([CONTAINER_BIN, "system", "start"], check=True)
    time.sleep(3)

    print("\n6. Verifying Apple Container services...")
    subprocess.run([CONTAINER_BIN, "system", "status"], check=True)
    subprocess.run([CONTAINER_BIN, "list", "-a"], check=True)

    print("\n==========================================================")
    print("🎉 Migration Successful!")
    print(f"Apple Container is now running from: {TARGET_DIR}")
    print("==========================================================")

if __name__ == "__main__":
    main()
