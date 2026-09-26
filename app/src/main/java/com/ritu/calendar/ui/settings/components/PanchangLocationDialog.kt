package com.ritu.calendar.ui.settings.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class IndianCity(val name: String, val state: String, val lat: Double, val lon: Double)

val POPULAR_CITIES = listOf(
    IndianCity("New Delhi", "Delhi NCR", 28.6139, 77.2090),
    IndianCity("Guwahati", "Assam / Northeast", 26.1445, 91.7362),
    IndianCity("Kolkata", "West Bengal", 22.5726, 88.3639),
    IndianCity("Mumbai", "Maharashtra", 19.0760, 72.8777),
    IndianCity("Chennai", "Tamil Nadu", 13.0827, 80.2707),
    IndianCity("Bengaluru", "Karnataka", 12.9716, 77.5946),
    IndianCity("Varanasi", "Uttar Pradesh", 25.3176, 82.9739),
    IndianCity("Shillong", "Meghalaya", 25.5788, 91.8933),
    IndianCity("Imphal", "Manipur", 24.8170, 93.9368),
    IndianCity("Kohima", "Nagaland", 25.6751, 94.1086),
    IndianCity("Aizawl", "Mizoram", 23.7271, 92.7176),
    IndianCity("Puri", "Odisha", 19.8135, 85.8312),
    IndianCity("Ahmedabad", "Gujarat", 23.0225, 72.5714),
    IndianCity("Amritsar", "Punjab", 31.6340, 74.8723)
)

@Composable
fun PanchangLocationDialog(
    currentCity: String,
    onLocationSelect: (String, Double, Double) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Set Panchang Calculation Location",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                POPULAR_CITIES.forEach { city ->
                    val isSelected = city.name.equals(currentCity, ignoreCase = true)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                onLocationSelect(city.name, city.lat, city.lon)
                                onDismiss()
                            }
                            .padding(vertical = 8.dp, horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = city.name,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "${city.state} (${String.format("%.2f", city.lat)}°N, ${String.format("%.2f", city.lon)}°E)",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        RadioButton(
                            selected = isSelected,
                            onClick = {
                                onLocationSelect(city.name, city.lat, city.lon)
                                onDismiss()
                            }
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Done")
            }
        },
        shape = RoundedCornerShape(20.dp)
    )
}
