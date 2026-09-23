package com.ritu.calendar.core.designsystem.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.navigation.Screen

enum class NavItem(
    val route: String,
    val title: String,
    val devanagari: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    TODAY(
        route = Screen.Today.route,
        title = "Today",
        devanagari = "आज",
        selectedIcon = Icons.Filled.WbSunny,
        unselectedIcon = Icons.Outlined.WbSunny
    ),
    MONTH(
        route = Screen.Month.route,
        title = "Month",
        devanagari = "मास",
        selectedIcon = Icons.Filled.CalendarMonth,
        unselectedIcon = Icons.Outlined.CalendarMonth
    ),
    YEAR(
        route = Screen.Year.route,
        title = "Year",
        devanagari = "वर्ष",
        selectedIcon = Icons.Filled.AutoAwesomeMosaic,
        unselectedIcon = Icons.Outlined.AutoAwesomeMosaic
    ),
    FESTIVALS(
        route = Screen.Festivals.route,
        title = "Festivals",
        devanagari = "उत्सव",
        selectedIcon = Icons.Filled.Celebration,
        unselectedIcon = Icons.Outlined.Celebration
    ),
    SEARCH(
        route = Screen.Search.route,
        title = "Search",
        devanagari = "खोज",
        selectedIcon = Icons.Filled.Search,
        unselectedIcon = Icons.Outlined.Search
    )
}

@Composable
fun RituNavigationBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier,
    accentColor: Color = MaterialTheme.colorScheme.primary
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp,
        shadowElevation = 8.dp
    ) {
        Column {
            IndianJaliBar(
                color = accentColor,
                alpha = 0.2f,
                height = 2.dp
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                NavItem.entries.forEach { item ->
                    val isSelected = currentRoute == item.route

                    val iconColor = if (isSelected) accentColor else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    val bgAlpha = if (isSelected) 0.12f else 0f
                    val animatedBg = animateColorAsState(
                        targetValue = accentColor.copy(alpha = bgAlpha),
                        animationSpec = tween(300),
                        label = "NavBg"
                    ).value

                    Column(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(animatedBg)
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) {
                                if (!isSelected) {
                                    onNavigate(item.route)
                                }
                            }
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                            contentDescription = item.title,
                            tint = iconColor,
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = item.title,
                            style = MaterialTheme.typography.labelSmall,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = iconColor
                        )
                    }
                }
            }
        }
    }
}
