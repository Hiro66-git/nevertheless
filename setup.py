#!/usr/bin/env python3
"""Setup script for backward compatibility."""
from setuptools import setup, find_packages

setup(
    name="leafcode",
    version="0.1.0",
    packages=find_packages(),
    entry_points={
        "console_scripts": [
            "leafcode=leafcode.cli:main",
        ],
    },
)
