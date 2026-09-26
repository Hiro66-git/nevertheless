package com.ritu.calendar

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.compose.rememberNavController
import com.ritu.calendar.core.designsystem.theme.RituTheme
import com.ritu.calendar.core.panchang.RituSeason
import com.ritu.calendar.navigation.RituNavGraph
import com.ritu.calendar.ui.events.CreateEditEventViewModel
import java.time.LocalDate

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as RituApplication
        val festivalRepository = app.festivalRepository
        val eventRepository = app.eventRepository
        val noteDao = app.database.noteDao()
        val userSettingsRepository = app.userSettingsRepository
        val notificationManager = app.notificationManager

        val createEditEventViewModel = CreateEditEventViewModel(
            eventRepository = eventRepository,
            notificationManager = notificationManager
        )

        setContent {
            val userSettings by userSettingsRepository.getUserSettings().collectAsState(
                initial = com.ritu.calendar.data.settings.UserSettings()
            )
            val currentSeason = RituSeason.fromGregorianMonth(LocalDate.now().monthValue)

            RituTheme(
                themeMode = userSettings.themeMode,
                currentSeason = currentSeason
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    RituNavGraph(
                        navController = navController,
                        festivalRepository = festivalRepository,
                        eventRepository = eventRepository,
                        noteDao = noteDao,
                        userSettingsRepository = userSettingsRepository,
                        createEditEventViewModel = createEditEventViewModel
                    )
                }
            }
        }
    }
}
