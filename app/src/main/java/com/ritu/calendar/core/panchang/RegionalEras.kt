package com.ritu.calendar.core.panchang

import java.time.LocalDate

data class RegionalErasInfo(
    val vikramSamvat: Int,
    val sakaSamvat: Int,
    val bhaskarEra: Int,       // Assamese Calendar
    val bengaliSan: Int,       // Bengali Calendar
    val kollamEra: Int,        // Malayalam Calendar
    val tamilYearName: String, // 60-year Jovian cycle
    val formattedSummary: String
)

object RegionalErasCalculator {

    private val TAMIL_YEARS = listOf(
        "Prabhava", "Vibhava", "Shukla", "Pramodoota", "Prajotpatti",
        "Angirasa", "Shrimukha", "Bhava", "Yuva", "Dhatri",
        "Ishvara", "Bahudhanya", "Pramathi", "Vikrama", "Vrishaprajapati",
        "Chitrabhanu", "Subhanu", "Tarana", "Parthiva", "Vyaya",
        "Sarvajit", "Sarvadhari", "Virodhi", "Vikriti", "Khara",
        "Nandana", "Vijaya", "Jaya", "Manmatha", "Durmukhi",
        "Hevilambi", "Vilambi", "Vikari", "Sharvari", "Plava",
        "Shubhakrit", "Shobhakrit", "Krodhi", "Vishvavasu", "Parabhava",
        "Plavanga", "Kilaka", "Saumya", "Sadharana", "Virodhikrit",
        "Paridhavi", "Pramadicha", "Ananda", "Rakshasa", "Nala",
        "Pingala", "Kalayukta", "Siddharthi", "Raudra", "Durmati",
        "Dundubhi", "Rudhrodgari", "Raktakshi", "Krodhana", "Akshaya"
    )

    fun calculate(date: LocalDate, lunarMonth: LunarMonth): RegionalErasInfo {
        val year = date.year
        // In North Indian / Chaitra based calendar, Vikram Samvat changes in Chaitra (approx March/April)
        val isPostChaitra = date.monthValue > 3 || (date.monthValue == 3 && date.dayOfMonth >= 22)

        val vikramSamvat = if (isPostChaitra) year + 57 else year + 56
        val sakaSamvat = if (isPostChaitra) year - 78 else year - 79
        val bhaskarEra = if (date.monthValue >= 4 && date.dayOfMonth >= 14) year - 593 else year - 594
        val bengaliSan = if (date.monthValue >= 4 && date.dayOfMonth >= 15) year - 593 else year - 594
        val kollamEra = if (date.monthValue >= 8 && date.dayOfMonth >= 17) year - 824 else year - 825

        // Tamil 60-year Jovian cycle index
        val tamilIndex = ((year - 1987 + 60) % 60 + 60) % 60
        val tamilYearName = TAMIL_YEARS[tamilIndex]

        return RegionalErasInfo(
            vikramSamvat = vikramSamvat,
            sakaSamvat = sakaSamvat,
            bhaskarEra = bhaskarEra,
            bengaliSan = bengaliSan,
            kollamEra = kollamEra,
            tamilYearName = tamilYearName,
            formattedSummary = "Vikram $vikramSamvat • Saka $sakaSamvat • Bhaskar $bhaskarEra"
        )
    }
}
