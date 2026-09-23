# ऋतु (Ritu) — The Living Indian Calendar of Seasons, Festivals & Life

> *"A calendar should feel like a living representation of time, culture, seasons, festivals, and personal life."*

[![Release](https://img.shields.io/badge/release-v1.0.0-orange.svg)](release/ritu-calendar-v1.0.0.apk)
[![Android](https://img.shields.io/badge/Platform-Android%208.0%2B%20(API%2026%2B)-green.svg)](https://developer.android.com)
[![Jetpack Compose](https://img.shields.io/badge/UI-Jetpack%20Compose%20%2B%20Material%203-blue.svg)](https://developer.android.com/jetpack/compose)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20MVVM%20%2B%20Offline%20First-purple.svg)]()

---

## 🌟 Introduction

**Ritu (ऋतु)** is a premier interactive Android calendar application that transforms conventional timekeeping into a cultural and astronomical experience. Rooted in traditional Indian concepts of time, astronomy, and seasons, Ritu harmonizes the **Shad-Ritu** (6 Indian seasons), **Dainik Panchang** (Tithi, Nakshatra, Yoga, Karana, Masa), **120+ Indian regional festivals** (with specialized archiving for Northeast India and Assam), and modern **personal schedule management**.

---

## ✨ Key Features & Core Experiences

### 1. 🌅 Living Today (`आज`)
- **Living Hero Date Canvas**: Large handcrafted typography, day names in Sanskrit & English, active season badge, and regional era summaries.
- **Dynamic Seasonal Aura**: Real-time ambient gradient response corresponding to the 6 classical seasons.
- **Live Dainik Panchang 4 Pillars**: Real-time calculation of Tithi (with Devanagari script), Nakshatra (with planetary lord & deity), Yoga, and Karana.
- **Sun & Moon Horizon**: NOAA-accurate Sunrise, Sunset, and Day Length along with vector-rendered Moon Phase with crater textures, illumination percentage, and lunar age.
- **Auspicious Muhurat Bar**: Abhijit Muhurat, Brahma Muhurat, and Rahu Kaal / Yamaganda intervals calculated from local solar positions.
- **Today's Personal Schedule**: Interactive widget with quick event creation.

### 2. 📅 Interactive Month View (`मास`)
- **High-Clarity Indian Grid**: 42-day calendar matrix with festival indicators, national holiday highlights, and moon phase symbols (🌕 Purnima, 🌑 Amavasya, ✨ Ekadashi).
- **Smooth Navigation**: Previous/Next month switching with gesture support and seasonal color transitions.
- **Category Filter Chips**: Filter view by All Days, 🌸 Festivals, 🏛️ Holidays, and 📌 Personal Events.
- **Selected Day Interactive Sheet**: Instant summary card displaying full date details, local celebrations, scheduled events, and quick-add actions.

### 3. 📖 Detailed Day Page (`दिन दर्शन`)
- **Immersive Day Header**: Deep dive into any date's astronomical coordinates and seasonal characteristics.
- **Festival Artwork Cards**: Cultural summaries, regional variations, and national holiday tags.
- **Complete Panchang & Muhurat Breakdown**: Expanded descriptions of ruling deities, tithi qualities (Nanda, Bhadra, Jaya, Rikta, Poorna), and lunar months.
- **Personal Chronological Timeline**: Hour-by-hour view of personal events, pujas, and meetings.
- **Notes & Reminders Journal**: Quick local journaling with timestamped notes.

### 4. 🗺️ Annual Tapestry Year View (`संवत्सर`)
- **12-Month Progression**: Multi-month interactive grid showing seasonal transitions and festival density.
- **Shad-Ritu Cycle Selector**: Filter and explore months by the six classical Ritus:
  - 🌸 **Vasanta** (Spring: Chaitra - Vaishakha)
  - ☀️ **Grishma** (Summer: Jyeshtha - Ashadha)
  - 🌧️ **Varsha** (Monsoon: Shravana - Bhadrapada)
  - 🌾 **Sharad** (Autumn: Ashvina - Kartika)
  - 🍂 **Hemanta** (Pre-Winter: Margashirsha - Pausha)
  - ❄️ **Shishira** (Winter: Magha - Phalguna)
- **Year Highlights**: Prominent national celebrations, historical equinoxes, and solstice commemorations.

### 5. 🪔 Comprehensive Festival Explorer (`उत्सव`)
- **120+ Authentic Indian Celebrations**: Filterable by Region, Religion/Tradition, Category, and Season.
- **Specialized Northeast & Assam Spotlight**: Rich archiving of Rongali Bihu, Kongali Bihu, Bhogali Bihu, Ambubachi Mela, Ali-Aye-Ligang, Me-Dam-Me-Phi, Hornbill Festival, Chapchar Kut, Yaoshang, and more.
- **Dedicated Festival Experiences**:
  - Exact Gregorian and Hindu Lunar Dates
  - Mythological Origins & Cultural Significance
  - Step-by-Step Sacred Rituals & Traditions
  - Authentic Regional Recipes & Prasad (e.g. Til Pitha, Modak, Puran Poli, Thekua, Sheer Khurma, Karah Parshad)
  - Live Countdown Timer

### 6. 🏛️ Regional & Astronomical Personalization
- **Primary Region Selection**: Pan-India, Northeast & Assam, North India, South India, East India, West India, and Central India.
- **Multiple Regional Eras**: Automatic calculation of Vikram Samvat, Saka Samvat (National Calendar), Bhaskar Era (Assam), Bengali San, Kollam Era (Kerala), and the 60-year Tamil Jovian Cycle.
- **City-Specific Coordinates**: Built-in coordinate calculations for New Delhi, Guwahati, Kolkata, Mumbai, Chennai, Bengaluru, Varanasi, Shillong, Imphal, Kohima, Aizawl, Puri, Ahmedabad, and Amritsar.

### 7. 📌 Personal Event Management & Persistence
- **Full CRUD Operations**: Create, view, edit, and delete personal events.
- **Categories**: Personal, Puja & Vrat, Birthday, Anniversary, Festival Observance, Holiday, Work.
- **Recurrence Support**: Daily, Weekly, Monthly, Yearly (Gregorian), and Lunar Annual (Vedic Tithi).
- **Notifications & Alarms**: Scheduled local broadcast alarms with exact time reminders.
- **Room Database**: 100% offline-first local persistence with SQLite Room DAOs.

### 8. 🔍 Global Search (`खोज`)
- Unified instant search across festivals, holidays, personal events, and cultural regions.
- Real-time result filtering by categories.

### 9. 🎨 5 Signature Design Themes
1. **Sandalwood Dawn (Light)**: Warm ivory surfaces, sandalwood textures, and vibrant saffron accents.
2. **Midnight Starlight (Dark)**: Deep slate obsidian, gentle starlight glows, and moonlit typography.
3. **Indian Heritage**: Rich terracotta, temple bronze, turmeric ochre, and sacred gold.
4. **Minimalist Slate**: Crisp monochrome surfaces with purposeful typographic hierarchy.
5. **Festival Mode**: High-vibrancy celebratory palette with royal purple, radiant amber, and peacock teal.

---

## 📐 Mathematical & Astronomical Foundations

Ritu features a built-in mathematical ephemeris engine that eliminates the need for external network lookups:
- **Julian Day Calculation**: Precision conversion from Gregorian calendar dates to Julian days ($J2000.0$ epoch).
- **True Solar Longitude ($\lambda_{sun}$)**: Computed using the mean anomaly and solar equation of the center.
- **True Lunar Longitude ($\lambda_{moon}$)**: Computed with periodic lunar perturbations (evection, variation, and annual equation).
- **Lahiri Ayanamsha**: Official Indian National Calendar precession adjustment applied to convert tropical to sidereal coordinates ($Nirayana$).
- **Tithi Formulation**: $Tithi = \lfloor (\lambda_{moon} - \lambda_{sun}) / 12^\circ \rfloor + 1$.
- **Nakshatra Formulation**: $Nakshatra = \lfloor \lambda_{moon} / 13.333333^\circ \rfloor + 1$.
- **NOAA Solar Calculation**: Rigorous solar zenith and hour angle equations for local Sunrise, Sunset, and Solar Noon.

---

## 🏗️ Project Architecture

```
com.ritu.calendar
├── core/
│   ├── panchang/             # Ephemeris engine, Tithi, Nakshatra, Seasons, Muhurat, Solar algorithms
│   ├── designsystem/
│   │   ├── theme/            # 5 custom themes, Color palettes, Typography, Shapes
│   │   └── components/       # Procedural Vector Mandalas, Toran borders, Moon phase canvas, Badges
│   ├── notifications/        # AlarmManager notification scheduling & BroadcastReceiver
│   └── utils/                # Date-time formatters and animation specs
├── data/
│   ├── local/                # Room DB, Entity definitions, DAOs, Type converters
│   ├── festival/             # Festival model, 120+ festival database, Repository
│   ├── event/                # PersonalEvent model, Categories, Recurrence rules, Repository
│   └── settings/             # UserPreferences and settings repository
├── navigation/               # NavGraph and Compose type-safe routing
└── ui/
    ├── today/                # Living Today experience & components
    ├── month/                # Interactive Month calendar grid & bottom sheet
    ├── day/                  # Day detailed view & Panchang timeline
    ├── year/                 # Annual 12-month tapestry & Shad-Ritu progression
    ├── festival/             # Festival discovery engine & rich detail views
    ├── events/               # Event creation, editing, and details
    ├── search/               # Global categorized search
    └── settings/             # Regional, theme, and coordinate personalization
```

---

## 🚀 Download & Installation

The release APK is available directly in the repository:

- 📦 **Direct Download**: [`release/ritu-calendar-v1.0.0.apk`](release/ritu-calendar-v1.0.0.apk)

To build the APK from source using Gradle:

```bash
./gradlew assembleRelease
# or for debug build
./gradlew assembleDebug
```

To run the automated verification test suite:

```bash
python3 test_ritu_verification.py
```

---

## 📜 License
Licensed under the [Apache License, Version 2.0](LICENSE).
