"""Generate the P0 fixture: a miniature but realistic slice of The Quiet Archive.

The Failed Procurement Programs collection deliberately carries the *exact* bug
found in the live audit (dateRange "1999-2023" and documentCount 11, while the
catalogue computes 1962-2011 from 5 members) so the checkers can be proven.

Run from p0/fixtures: python3 gen.py
"""

import json
import os

os.makedirs("src/data", exist_ok=True)

HOST_NTRS = "NASA Technical Reports Server"
HOST_OSTI = "OSTI.GOV"
HOST_NAO = "National Audit Office (UK)"
HOST_PI = "Public Intelligence"
HOST_IA = "Internet Archive"
HOST_HMLR = "HM Land Registry"
HOST_NAI = "National Archives of India"


def doc(**kw):
    base = dict(
        author=None, issuerLong=None, declassification="unclassified", altLinks=[],
        scope=None, flags=[], verify=None, country="United States",
    )
    base.update(kw)
    if base["verify"] is None:
        base.pop("verify")
    return base


docs = [
    doc(
        id="QA-0046", slug="ntrs-space-shuttle-decision",
        title="The Space Shuttle Decision: NASA's Search for a Reusable Space Vehicle (SP-4221)",
        author="T. A. Heppenheimer", issuer="nasa", issuerShort="NASA",
        issuerLong="National Aeronautics and Space Administration",
        documentType="official-history", documentDate="1999-07-01", releaseDate="1999-08-13",
        sourceFamily="declassified",
        sourceUrl="https://ntrs.nasa.gov/citations/19990088869",
        summary=("Heppenheimer's official history of how the Shuttle's design was squeezed by Air Force "
                 "requirements, OMB budget caps and political compromises in the early 1970s."),
        tags=["Space Shuttle", "procurement", "OMB", "design compromise"],
        year=1999, host=HOST_NTRS, status="live",
    ),
    doc(
        id="QA-0042", slug="ntrs-hubble-optical-failure",
        title="The Hubble Space Telescope Optical Systems Failure Report",
        author="NASA", issuer="nasa", issuerShort="NASA",
        issuerLong="National Aeronautics and Space Administration",
        documentType="report", documentDate="1990-11-01", releaseDate="1990-11-01",
        sourceFamily="oversight", sourceUrl="https://ntrs.nasa.gov/citations/19910010258",
        summary=("The investigation into why the $1.5 billion telescope launched with a primary mirror "
                 "ground to the wrong shape."),
        tags=["Hubble", "quality assurance", "contractor oversight"],
        year=1990, host=HOST_NTRS, status="live",
    ),
    doc(
        id="QA-0031", slug="osti-tory-iic-hazards",
        title="Tory II-C hazards of operation (Project Pluto nuclear ramjet), Part 10",
        author="Lawrence Livermore National Laboratory", issuer="llnl", issuerShort="LLNL",
        issuerLong="Lawrence Livermore National Laboratory",
        documentType="report", documentDate="1962-12-28", releaseDate="1962-12-28",
        declassification="declassified", sourceFamily="declassified",
        sourceUrl="https://www.osti.gov/biblio/4352655",
        summary=("Livermore's hazards analysis for Tory II-C, the ground-test reactor of Project Pluto, "
                 "a nuclear-powered ramjet missile meant to fly for weeks at low altitude."),
        tags=["Project Pluto", "nuclear ramjet"],
        year=1962, host=HOST_OSTI, status="live",
    ),
    doc(
        id="QA-0079", slug="uk-nao-npfit",
        title=("The National Programme for IT in the NHS: an update on the delivery of detailed care "
               "records systems (NAO, 2011)"),
        author="National Audit Office", issuer="nao", issuerShort="NAO",
        issuerLong="National Audit Office (UK)",
        documentType="report", documentDate="2011-05-18", releaseDate="2011-05-18",
        sourceFamily="oversight",
        sourceUrl=("https://www.nao.org.uk/reports/the-national-programme-for-it-in-the-nhs-an-update-"
                   "on-the-delivery-of-detailed-care-records-systems/"),
        summary=("The UK auditor's verdict on the core of the NHS National Programme for IT, among the "
                 "most expensive civilian IT failures anywhere."),
        tags=["NHS", "IT procurement", "United Kingdom"],
        year=2011, country="United Kingdom", host=HOST_NAO, status="live",
    ),
    doc(
        id="QA-0146", slug="pi-fbi-sovereign-citizen-guide",
        title="FBI Domestic Terrorism Reference Guide: Sovereign Citizen Violent Extremism (U//FOUO)",
        author="Federal Bureau of Investigation", issuer="fbi", issuerShort="FBI",
        issuerLong="Federal Bureau of Investigation",
        documentType="manual", documentDate="2023", releaseDate="2024-01-29",
        declassification="controlled-unclassified", sourceFamily="aggregator",
        sourceUrl="https://publicintelligence.net/fbi-sovereign-citizen-violent-extremism-guide/",
        summary=("An FBI reference guide for law enforcement on the sovereign-citizen movement: its "
                 "pseudo-legal beliefs, paper-terrorism tactics and indicators of violence."),
        tags=["sovereign citizens", "domestic terrorism"],
        flags=["host-blocks-automated-checks", "document-date-approx", "release-date-approx"],
        verify=dict(manual="2026-10-15", method="hand", note="Host blocks automated checkers."),
        year=2023, host=HOST_PI, status="blocked",
    ),
    doc(
        id="QA-0076", slug="ia-sigir-hard-lessons",
        title="Hard Lessons: The Iraq Reconstruction Experience (SIGIR, 2009)",
        author="Special Inspector General for Iraq Reconstruction", issuer="sigir",
        issuerShort="SIGIR", issuerLong="Special Inspector General for Iraq Reconstruction",
        documentType="official-history", documentDate="2009-02", releaseDate="2009-02",
        sourceFamily="oversight",
        sourceUrl=("https://cybercemetery.unt.edu/archive/sigir/20131001000000/http://www.sigir.mil/"
                   "files/HardLessons/Hard_Lessons_Report.pdf"),
        altLinks=[dict(label="Internet Archive", url="https://archive.org/details/HardLessons")],
        summary=("The Special Inspector General for Iraq Reconstruction's history of how more than "
                 "$50 billion in U.S. reconstruction spending was planned, improvised and often wasted."),
        tags=["Iraq", "reconstruction", "waste", "dead link"],
        flags=["mirror-used", "release-date-approx", "archive-used", "official-url-dead"],
        year=2009, host=HOST_IA, status="dead",
    ),
    doc(
        id="QA-0171", slug="uk-price-paid-data", title="HM Land Registry Price Paid Data",
        author="HM Land Registry", issuer="hmlr", issuerShort="HMLR", issuerLong="HM Land Registry",
        documentType="dataset", documentDate="1995-01", releaseDate="2013",
        sourceFamily="bulk-data",
        sourceUrl="https://use-land-property-data.service.gov.uk/datasets/price-paid",
        summary=("Every residential property sale in England and Wales since 1995, with price, date, "
                 "postcode and property type."),
        tags=["housing", "property prices", "open data"], flags=["release-date-approx"],
        year=1995, country="United Kingdom", host=HOST_HMLR, status="live",
    ),
    doc(
        id="QA-0207", slug="in-nai-partition-records",
        title="National Archives of India: partition-era records, 1947",
        author="National Archives of India", issuer="nai", issuerShort="NAI",
        issuerLong="National Archives of India",
        documentType="collection", documentDate="1748", releaseDate="2010",
        sourceFamily="declassified", sourceUrl="https://nationalarchives.nic.in/",
        summary=("The Indian national archives' holding of colonial and partition-era records, from "
                 "eighteenth-century Persian correspondence to the transfer of power papers of 1947."),
        tags=["partition", "South Asia", "1947"],
        flags=["release-date-approx", "release-date-unknown"],
        year=1748, country="India", host=HOST_NAI, status="live",
    ),
]

collections = [
    dict(
        slug="failed-procurement-programs", title="Failed Procurement Programs",
        description=("Billions spent, little delivered: auditors' autopsies of projects that collapsed "
                     "under their own requirements."),
        documentCount=11,        # wrong on purpose (catalogue has 5 members)
        dateRange="1999–2023",   # wrong on purpose (catalogue computes 1962–2011)
        documents=[
            "ntrs-space-shuttle-decision", "ntrs-hubble-optical-failure", "osti-tory-iic-hazards",
            "uk-nao-npfit", "ia-sigir-hard-lessons",
        ],
    ),
    dict(
        slug="raw-data-the-governments-spreadsheets",
        title="Raw Data: The Government's Own Spreadsheets",
        description=("Fifteen free bulk datasets, on storms, crashes, lobbying, sentencing and toxic "
                     "releases, that most newsrooms never download."),
        documentCount=1, dateRange="1995–1995", documents=["uk-price-paid-data"],
    ),
    dict(
        slug="inside-the-bureau", title="Inside the Bureau",
        description="Gangsters, physicists, poets, radicals and hijackers: fifty years of FBI files.",
        documentCount=1, dateRange="2023–2023", documents=["pi-fbi-sovereign-citizen-guide"],
    ),
    dict(
        slug="south-asia-in-the-files", title="South Asia in the Files",
        description=("Partition-era archives, the 1971 war, and the bomb, as seen from New Delhi and "
                     "Washington."),
        documentCount=1, dateRange="1748–1974",
        documents=["in-nai-partition-records", "missing-record-slug"],  # missing member on purpose
    ),
]

results = []
for d in docs:
    st = d["status"]
    results.append(dict(
        key=d["slug"], id=d["id"], slug=d["slug"], title=d["title"], sourceUrl=d["sourceUrl"],
        status=st, httpStatus=404 if st == "dead" else 200, finalUrl=None, elapsedMs=420,
        flag="official-url-dead" if st == "dead" else None,
        derivedFlags=d.get("flags", []), pinned=False,
        manual=(d.get("verify") or {}).get("manual"),
        archive=None, archiveNote=None,
        regression=(d["id"] == "QA-0076"),
        checkedAt="2026-10-15T10:00:00.000Z",
    ))

report = dict(
    schemaVersion=2,
    summary=dict(
        generatedAt="2026-10-15T10:00:00.000Z", checked=len(docs), catalogueSize=len(docs),
        counts={"live": 5, "blocked": 1, "dead": 1},
        flags={"host-blocks-automated-checks": 1, "archive-used": 1, "official-url-dead": 1},
        archiveFallbacks=0,
        regressions=[dict(id="QA-0076", slug="ia-sigir-hard-lessons",
                          url="https://cybercemetery.unt.edu/archive/sigir/20131001000000/http://www.sigir.mil/files/HardLessons/Hard_Lessons_Report.pdf")],
        failures=[dict(id="QA-0076", slug="ia-sigir-hard-lessons", status="dead", detail="404", archive=None)],
    ),
    results=results,
)

with open("src/data/documents.json", "w", encoding="utf-8") as fh:
    json.dump(docs, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
with open("src/data/collections.json", "w", encoding="utf-8") as fh:
    json.dump({"collections": collections}, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
with open("src/data/verify-report.json", "w", encoding="utf-8") as fh:
    json.dump(report, fh, indent=2, ensure_ascii=False)
    fh.write("\n")

print("wrote", sorted(os.listdir("src/data")))
