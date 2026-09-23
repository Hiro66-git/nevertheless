package com.ritu.calendar.data.festival

enum class IndianRegion(
    val displayName: String,
    val devanagari: String,
    val statesIncluded: List<String>
) {
    ALL_INDIA(
        displayName = "Pan-India",
        devanagari = "अखिल भारत",
        statesIncluded = listOf("All States & Union Territories")
    ),
    NORTHEAST_ASSAM(
        displayName = "Northeast & Assam",
        devanagari = "पूर्वोत्तर एवं असम",
        statesIncluded = listOf("Assam", "Manipur", "Nagaland", "Meghalaya", "Mizoram", "Tripura", "Arunachal Pradesh", "Sikkim")
    ),
    NORTH_INDIA(
        displayName = "North India",
        devanagari = "उत्तर भारत",
        statesIncluded = listOf("Uttar Pradesh", "Punjab", "Haryana", "Delhi", "Himachal Pradesh", "Jammu & Kashmir", "Uttarakhand", "Rajasthan")
    ),
    SOUTH_INDIA(
        displayName = "South India",
        devanagari = "दक्षिण भारत",
        statesIncluded = listOf("Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana")
    ),
    EAST_INDIA(
        displayName = "East India",
        devanagari = "पूर्व भारत",
        statesIncluded = listOf("West Bengal", "Odisha", "Bihar", "Jharkhand")
    ),
    WEST_INDIA(
        displayName = "West India",
        devanagari = "पश्चिम भारत",
        statesIncluded = listOf("Maharashtra", "Gujarat", "Goa")
    ),
    CENTRAL_INDIA(
        displayName = "Central India",
        devanagari = "मध्य भारत",
        statesIncluded = listOf("Madhya Pradesh", "Chhattisgarh")
    );

    companion object {
        fun fromCode(code: String?): IndianRegion {
            return entries.firstOrNull { it.name.equals(code, ignoreCase = true) } ?: ALL_INDIA
        }
    }
}
