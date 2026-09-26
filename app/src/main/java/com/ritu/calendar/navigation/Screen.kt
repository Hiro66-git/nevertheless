package com.ritu.calendar.navigation

sealed class Screen(val route: String) {
    object Today : Screen("today")
    object Month : Screen("month")
    object Day : Screen("day/{date}") {
        fun createRoute(date: String) = "day/$date"
    }
    object Year : Screen("year")
    object Festivals : Screen("festivals")
    object FestivalDetail : Screen("festival/{festivalId}") {
        fun createRoute(festivalId: String) = "festival/$festivalId"
    }
    object CreateEvent : Screen("event/create?date={date}") {
        fun createRoute(date: String? = null) = if (date != null) "event/create?date=$date" else "event/create"
    }
    object EditEvent : Screen("event/edit/{eventId}") {
        fun createRoute(eventId: Long) = "event/edit/$eventId"
    }
    object Search : Screen("search")
    object Settings : Screen("settings")
}
