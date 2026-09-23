package com.ritu.calendar.navigation

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import com.ritu.calendar.core.designsystem.components.RituNavigationBar
import com.ritu.calendar.data.event.EventRepository
import com.ritu.calendar.data.festival.FestivalRepository
import com.ritu.calendar.data.local.dao.NoteDao
import com.ritu.calendar.data.settings.UserSettingsRepository
import com.ritu.calendar.ui.day.DayScreen
import com.ritu.calendar.ui.day.DayViewModel
import com.ritu.calendar.ui.events.CreateEditEventScreen
import com.ritu.calendar.ui.events.CreateEditEventViewModel
import com.ritu.calendar.ui.events.EventDetailScreen
import com.ritu.calendar.ui.festival.FestivalDetailScreen
import com.ritu.calendar.ui.festival.FestivalExplorerScreen
import com.ritu.calendar.ui.festival.FestivalExplorerViewModel
import com.ritu.calendar.ui.month.MonthScreen
import com.ritu.calendar.ui.month.MonthViewModel
import com.ritu.calendar.ui.search.GlobalSearchScreen
import com.ritu.calendar.ui.search.GlobalSearchViewModel
import com.ritu.calendar.ui.settings.SettingsScreen
import com.ritu.calendar.ui.settings.SettingsViewModel
import com.ritu.calendar.ui.today.TodayScreen
import com.ritu.calendar.ui.today.TodayViewModel
import com.ritu.calendar.ui.year.YearScreen
import com.ritu.calendar.ui.year.YearViewModel
import java.time.LocalDate

@Composable
fun RituNavGraph(
    navController: NavHostController,
    festivalRepository: FestivalRepository,
    eventRepository: EventRepository,
    noteDao: NoteDao,
    userSettingsRepository: UserSettingsRepository,
    createEditEventViewModel: CreateEditEventViewModel,
    modifier: Modifier = Modifier
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Check if current destination should show the bottom navigation bar
    val showBottomBar = when (currentRoute) {
        Screen.Today.route,
        Screen.Month.route,
        Screen.Year.route,
        Screen.Festivals.route,
        Screen.Search.route -> true
        else -> false
    }

    // ViewModels
    val todayViewModel = remember { TodayViewModel(festivalRepository, eventRepository, userSettingsRepository) }
    val monthViewModel = remember { MonthViewModel(festivalRepository, eventRepository, userSettingsRepository) }
    val dayViewModel = remember { DayViewModel(festivalRepository, eventRepository, noteDao, userSettingsRepository) }
    val yearViewModel = remember { YearViewModel(festivalRepository) }
    val festivalExplorerViewModel = remember { FestivalExplorerViewModel(festivalRepository) }
    val globalSearchViewModel = remember { GlobalSearchViewModel(festivalRepository, eventRepository) }
    val settingsViewModel = remember { SettingsViewModel(userSettingsRepository) }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                RituNavigationBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(Screen.Today.route) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = Screen.Today.route,
            modifier = modifier.padding(paddingValues),
            enterTransition = { fadeIn(animationSpec = tween(300)) },
            exitTransition = { fadeOut(animationSpec = tween(300)) }
        ) {
            composable(Screen.Today.route) {
                TodayScreen(
                    viewModel = todayViewModel,
                    onNavigateToDay = { dateStr -> navController.navigate(Screen.Day.createRoute(dateStr)) },
                    onNavigateToFestival = { festId -> navController.navigate(Screen.FestivalDetail.createRoute(festId)) },
                    onNavigateToCreateEvent = { dateStr -> navController.navigate(Screen.CreateEvent.createRoute(dateStr)) },
                    onNavigateToEventDetail = { eventId -> navController.navigate(Screen.EditEvent.createRoute(eventId)) },
                    onNavigateToSearch = { navController.navigate(Screen.Search.route) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
                )
            }

            composable(Screen.Month.route) {
                MonthScreen(
                    viewModel = monthViewModel,
                    onNavigateToDay = { dateStr -> navController.navigate(Screen.Day.createRoute(dateStr)) },
                    onNavigateToFestival = { festId -> navController.navigate(Screen.FestivalDetail.createRoute(festId)) },
                    onNavigateToCreateEvent = { dateStr -> navController.navigate(Screen.CreateEvent.createRoute(dateStr)) },
                    onNavigateToEventDetail = { eventId -> navController.navigate(Screen.EditEvent.createRoute(eventId)) },
                    onNavigateToSearch = { navController.navigate(Screen.Search.route) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
                )
            }

            composable(
                route = Screen.Day.route,
                arguments = listOf(navArgument("date") { type = NavType.StringType })
            ) { backStackEntry ->
                val dateStr = backStackEntry.arguments?.getString("date") ?: LocalDate.now().toString()
                DayScreen(
                    dateString = dateStr,
                    viewModel = dayViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToFestival = { festId -> navController.navigate(Screen.FestivalDetail.createRoute(festId)) },
                    onNavigateToCreateEvent = { date -> navController.navigate(Screen.CreateEvent.createRoute(date)) },
                    onNavigateToEventDetail = { eventId -> navController.navigate(Screen.EditEvent.createRoute(eventId)) }
                )
            }

            composable(Screen.Year.route) {
                YearScreen(
                    viewModel = yearViewModel,
                    onNavigateToMonth = { year, month ->
                        monthViewModel.loadMonth(java.time.YearMonth.of(year, month))
                        navController.navigate(Screen.Month.route)
                    },
                    onNavigateToFestival = { festId -> navController.navigate(Screen.FestivalDetail.createRoute(festId)) },
                    onNavigateToSearch = { navController.navigate(Screen.Search.route) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
                )
            }

            composable(Screen.Festivals.route) {
                FestivalExplorerScreen(
                    viewModel = festivalExplorerViewModel,
                    onNavigateToDetail = { festId -> navController.navigate(Screen.FestivalDetail.createRoute(festId)) },
                    onNavigateToSearch = { navController.navigate(Screen.Search.route) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
                )
            }

            composable(
                route = Screen.FestivalDetail.route,
                arguments = listOf(navArgument("festivalId") { type = NavType.StringType })
            ) { backStackEntry ->
                val festId = backStackEntry.arguments?.getString("festivalId") ?: ""
                FestivalDetailScreen(
                    festivalId = festId,
                    viewModel = festivalExplorerViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(
                route = Screen.CreateEvent.route,
                arguments = listOf(navArgument("date") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                })
            ) { backStackEntry ->
                val dateStr = backStackEntry.arguments?.getString("date")
                CreateEditEventScreen(
                    dateString = dateStr,
                    eventId = null,
                    viewModel = createEditEventViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(
                route = Screen.EditEvent.route,
                arguments = listOf(navArgument("eventId") { type = NavType.LongType })
            ) { backStackEntry ->
                val eventId = backStackEntry.arguments?.getLong("eventId") ?: 0L
                CreateEditEventScreen(
                    dateString = null,
                    eventId = eventId,
                    viewModel = createEditEventViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Search.route) {
                GlobalSearchScreen(
                    viewModel = globalSearchViewModel,
                    onNavigateToFestival = { festId -> navController.navigate(Screen.FestivalDetail.createRoute(festId)) },
                    onNavigateToEvent = { eventId -> navController.navigate(Screen.EditEvent.createRoute(eventId)) },
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen(
                    viewModel = settingsViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}
