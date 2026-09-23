package com.ritu.calendar.core.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.ritu.calendar.MainActivity
import com.ritu.calendar.R

class EventReminderReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val eventId = intent.getLongExtra("EXTRA_EVENT_ID", 0L)
        val eventTitle = intent.getStringExtra("EXTRA_EVENT_TITLE") ?: "Event Reminder"
        val eventDescription = intent.getStringExtra("EXTRA_EVENT_DESC") ?: "Scheduled event in Ritu Calendar"

        showNotification(context, eventId.toInt(), eventTitle, eventDescription)
    }

    private fun showNotification(
        context: Context,
        notificationId: Int,
        title: String,
        description: String
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "ritu_calendar_reminders"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Event & Festival Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                this.description = "Reminders for personal events, pujas, and Indian festivals."
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("ऋतु • $title")
            .setContentText(description)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(notificationId, notification)
    }
}
