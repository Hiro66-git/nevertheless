package com.ritu.calendar

import android.app.Application
import com.ritu.calendar.core.notifications.RituNotificationManager
import com.ritu.calendar.data.event.EventRepository
import com.ritu.calendar.data.festival.FestivalRepository
import com.ritu.calendar.data.local.AppDatabase
import com.ritu.calendar.data.settings.UserSettingsRepository

class RituApplication : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var festivalRepository: FestivalRepository
        private set

    lateinit var eventRepository: EventRepository
        private set

    lateinit var userSettingsRepository: UserSettingsRepository
        private set

    lateinit var notificationManager: RituNotificationManager
        private set

    override fun onCreate() {
        super.onCreate()
        database = AppDatabase.getDatabase(this)
        festivalRepository = FestivalRepository()
        eventRepository = EventRepository(database.personalEventDao())
        userSettingsRepository = UserSettingsRepository(database.userPreferencesDao())
        notificationManager = RituNotificationManager(this)
    }
}
