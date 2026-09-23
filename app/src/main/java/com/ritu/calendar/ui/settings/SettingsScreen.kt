package com.ritu.calendar.ui.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Public
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.designsystem.components.RituTopAppBar
import com.ritu.calendar.ui.settings.components.AboutRituSection
import com.ritu.calendar.ui.settings.components.PanchangLocationDialog
import com.ritu.calendar.ui.settings.components.RegionSelectorDialog
import com.ritu.calendar.ui.settings.components.ThemeSelectorRow

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val settings = uiState.userSettings

    Scaffold(
        topBar = {
            RituTopAppBar(
                title = "Settings & Culture",
                devanagariTitle = "सेटिंग्स",
                canNavigateBack = true,
                onNavigateBack = onNavigateBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Theme Selector Row
            ThemeSelectorRow(
                currentTheme = settings.themeMode,
                onThemeSelect = { viewModel.updateTheme(it) }
            )

            // Regional Preferences Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = "Regional & Astronomical Personalization",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    SettingsActionRow(
                        icon = Icons.Default.Public,
                        title = "Primary Cultural Region",
                        subtitle = "${settings.selectedRegion.displayName} (${settings.selectedRegion.devanagari})",
                        onClick = { viewModel.setRegionDialogOpen(true) }
                    )

                    Divider()

                    SettingsActionRow(
                        icon = Icons.Default.LocationOn,
                        title = "Panchang City & Coordinates",
                        subtitle = "${settings.cityName} (${String.format("%.2f", settings.latitude)}°N, ${String.format("%.2f", settings.longitude)}°E)",
                        onClick = { viewModel.setLocationDialogOpen(true) }
                    )

                    Divider()

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Notifications,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Column {
                                Text(
                                    text = "Event & Festival Reminders",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "Receive notifications before scheduled events",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        Switch(
                            checked = settings.enableNotifications,
                            onCheckedChange = { viewModel.toggleNotifications(it) }
                        )
                    }
                }
            }

            // About Ritu Section
            AboutRituSection()

            Spacer(modifier = Modifier.height(24.dp))
        }

        if (uiState.isRegionDialogOpen) {
            RegionSelectorDialog(
                currentRegion = settings.selectedRegion,
                onRegionSelect = { viewModel.updateRegion(it) },
                onDismiss = { viewModel.setRegionDialogOpen(false) }
            )
        }

        if (uiState.isLocationDialogOpen) {
            PanchangLocationDialog(
                currentCity = settings.cityName,
                onLocationSelect = { city, lat, lon ->
                    viewModel.updateLocation(city, lat, lon)
                },
                onDismiss = { viewModel.setLocationDialogOpen(false) }
            )
        }
    }
}

@Composable
private fun SettingsActionRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.weight(1f)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = "Change",
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
